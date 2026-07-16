import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClaimsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Submit a new claim for a Match
   */
  async createClaim(claimantId: string, matchId: string, answers: any[]) {
    // 1. Verify Match exists
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: true,
        foundItem: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // 2. Verify claimant is the owner of the lost item
    if (match.lostItem.ownerId !== claimantId) {
      throw new BadRequestException('Only the owner of the lost item can claim this match');
    }

    // 3. Retrieve secret questions from FoundItem
    const foundItem = match.foundItem;
    const secretQuestions = (foundItem.secretQuestions as any[]) || [];

    if (secretQuestions.length === 0) {
      throw new BadRequestException('This found item does not have verification questions');
    }

    // 4. Calculate verification score
    const verificationScore = this.calculateVerificationScore(answers, secretQuestions);

    // 5. Create Claim record
    const claim = await this.prisma.claim.create({
      data: {
        matchId,
        claimantId,
        verificationScore,
        answers: answers as any,
        status: 'PENDING',
      },
    });

    // Send WhatsApp Alert
    const claimant = await this.prisma.user.findUnique({ where: { id: claimantId } });
    this.notificationsService.sendClaimSubmittedAlert(
      claim,
      claimant?.name || 'Unknown',
      match.lostItem.title,
      verificationScore
    ).catch(err => {
      console.error('Failed to send claim WhatsApp alert:', err);
    });

    // 6. Auto-process high-confidence claims (score >= 70)
    if (verificationScore >= 70) {
      await this.approveClaim(claim.id, 'System auto-approved due to high ownership verification score');
    } else {
      // If score is weak, check if trust points should be deducted for spam/false claims
      if (verificationScore < 20) {
        // Severe mismatch: deduct points for spam/false reporting
        await this.usersService.updateTrustScore(
          claimantId,
          -15,
          `Failed ownership verification for claim on [${foundItem.title}] (Score: ${verificationScore}%)`,
        );
      }
    }

    return this.findOne(claim.id);
  }

  /**
   * Ownership Verification Scoring Engine
   * Compares claimant's answers with finder's secret answers
   */
  private calculateVerificationScore(claimantAnswers: any[], secretQuestions: any[]): number {
    if (secretQuestions.length === 0) return 100;

    let totalScore = 0;
    const weightPerQuestion = 100 / secretQuestions.length;

    for (const sq of secretQuestions) {
      // Find matching claimant answer
      const ca = claimantAnswers.find(
        (a) => a.question.trim().toLowerCase() === sq.question.trim().toLowerCase(),
      );

      if (!ca) continue; // Unanswered question

      const qScore = this.compareText(ca.answer, sq.answer);
      totalScore += qScore * weightPerQuestion;
    }

    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Text comparison helper (Jaccard similarity on tokens)
   */
  private compareText(ans1: string, ans2: string): number {
    const cleanStr = (s: string) =>
      s
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .trim();

    const str1 = cleanStr(ans1);
    const str2 = cleanStr(ans2);

    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    const tokens1 = str1.split(/\s+/);
    const tokens2 = str2.split(/\s+/);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0.0;

    return intersection.size / union.size;
  }

  /**
   * Approve a Claim
   */
  async approveClaim(claimId: string, notes = 'Claim approved') {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        match: {
          include: {
            lostItem: true,
            foundItem: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // 1. Update claim status
    await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'APPROVED' },
    });

    // 2. Update match status
    await this.prisma.match.update({
      where: { id: claim.matchId },
      data: { status: 'RESOLVED' },
    });

    // 3. Update lost & found item statuses to returned/resolved
    await this.prisma.lostItem.update({
      where: { id: claim.match.lostItemId },
      data: { status: 'RETURNED' },
    });

    await this.prisma.foundItem.update({
      where: { id: claim.match.foundItemId },
      data: { status: 'RETURNED' },
    });

    // 4. Reward both users trust points
    // Owner/Claimant gets +10 points for successful recovery
    await this.usersService.updateTrustScore(
      claim.claimantId,
      10,
      `Successfully recovered lost item [${claim.match.lostItem.title}]`,
    );

    // Finder gets +10 points for returning the item
    await this.usersService.updateTrustScore(
      claim.match.foundItem.finderId,
      10,
      `Successfully returned found item [${claim.match.foundItem.title}] to its owner`,
    );

    // Send WhatsApp Alert
    const claimantUser = await this.prisma.user.findUnique({ where: { id: claim.claimantId } });
    const finderUser = await this.prisma.user.findUnique({ where: { id: claim.match.foundItem.finderId } });
    
    this.notificationsService.sendItemRecoveredAlert(
      claim.match.lostItem.title,
      claimantUser?.name || 'Unknown User',
      finderUser?.name || 'Unknown Finder'
    ).catch(err => {
      console.error('Failed to send item recovered alert:', err);
    });

    return this.findOne(claimId);
  }

  /**
   * Reject a Claim
   */
  async rejectClaim(claimId: string, reason = 'Claim rejected') {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        match: {
          include: {
            lostItem: true,
            foundItem: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // 1. Update claim status
    await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'REJECTED' },
    });

    // 2. Update match status back to pending so someone else can claim if needed, or if it was a false claim
    await this.prisma.match.update({
      where: { id: claim.matchId },
      data: { status: 'PENDING' },
    });

    // 3. Deduct trust score from fraudulent/incorrect claimant
    await this.usersService.updateTrustScore(
      claim.claimantId,
      -15,
      `Rejected claim on found item [${claim.match.foundItem.title}]: ${reason}`,
    );

    return this.findOne(claimId);
  }

  async findOne(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        claimant: true,
        match: {
          include: {
            lostItem: true,
            foundItem: true,
          },
        },
      },
    });
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }
    return claim;
  }

  async findAll() {
    return this.prisma.claim.findMany({
      include: {
        claimant: true,
        match: {
          include: {
            lostItem: true,
            foundItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteClaim(id: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }
    return this.prisma.claim.delete({ where: { id } });
  }
}
