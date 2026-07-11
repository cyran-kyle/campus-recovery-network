import React, { useState, useEffect } from 'react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

interface User {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  course?: string;
  photo?: string;
  sex?: string;
  password?: string;
  isVerified: boolean;
  trustScore: number;
  role: string;
  createdAt: string;
  trustLogs?: TrustLog[];
  _count?: {
    lostItems: number;
    foundItems: number;
    claims: number;
  };
}

interface LostItem {
  id: string;
  ownerId: string;
  owner?: User;
  title: string;
  description: string;
  category: string;
  locationLost: string;
  dateLost: string;
  imageUrl?: string;
  status: string; // LOST, MATCHED, CLAIMED, RETURNED
  fingerprint?: string;
  createdAt: string;
}

interface FoundItem {
  id: string;
  finderId: string;
  finder?: User;
  title: string;
  description: string;
  category: string;
  locationFound: string;
  dateFound: string;
  imageUrl?: string;
  status: string; // FOUND, MATCHED, CLAIMED, RETURNED
  fingerprint?: string;
  secretQuestions?: Array<{ question: string; answer: string }>;
  createdAt: string;
}

interface Match {
  id: string;
  lostItemId: string;
  lostItem: LostItem;
  foundItemId: string;
  foundItem: FoundItem;
  score: number;
  status: string; // PENDING, VERIFIED, RESOLVED, REJECTED
  createdAt: string;
  claims?: Claim[];
}

interface Claim {
  id: string;
  matchId: string;
  match?: Match;
  claimantId: string;
  claimant?: User;
  verificationScore: number;
  answers: Array<{ question: string; answer: string }>;
  status: string; // PENDING, APPROVED, REJECTED
  createdAt: string;
}

interface TrustLog {
  id: string;
  userId: string;
  scoreChange: number;
  reason: string;
  createdAt: string;
}

// ==========================================
// 2. INITIAL MOCK USERS (Local Fallback Setup)
// ==========================================
const INITIAL_MOCK_USERS: User[] = [
  {
    id: 'u-kyle',
    studentId: 'Kyle',
    name: 'Kyle',
    email: 'kyle@university.edu',
    trustScore: 200,
    role: 'ADMIN',
    isVerified: true,
    password: 'Kyle16',
    createdAt: new Date().toISOString(),
  }
];

// ==========================================
// 3. FRONTEND LOCAL SIMILARITY ALGORITHMS
// ==========================================
const calculateLocalKeywordSimilarity = (str1: string, str2: string): number => {
  const stopWords = new Set(['a', 'an', 'the', 'is', 'at', 'in', 'on', 'with', 'and', 'or', 'of', 'for', 'to', 'was', 'my', 'i', 'found', 'lost']);
  const tokenize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  };
  const tokens1 = new Set(tokenize(str1));
  const tokens2 = new Set(tokenize(str2));
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  return intersection.size / union.size;
};

const calculateLocalFingerprintSimilarity = (fp1?: string, fp2?: string): number => {
  if (!fp1 || !fp2) return 0;
  const parts1 = fp1.toUpperCase().split('-');
  const parts2 = fp2.toUpperCase().split('-');
  let matches = 0;
  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i] || parts1[i].includes(parts2[i]) || parts2[i].includes(parts1[i])) {
      matches++;
    }
  }
  return maxLen > 0 ? matches / maxLen : 0;
};

const calculateLocalMatchScore = (lost: LostItem, found: FoundItem): number => {
  let category = 0;
  let location = 0;
  let date = 0;
  let keyword = 0;
  let fingerprint = 0;
  let image = 0;

  // 1. Category (30 pts)
  if (lost.category.trim().toLowerCase() === found.category.trim().toLowerCase()) {
    category = 30;
  }

  // 2. Location (20 pts)
  const locLost = lost.locationLost.trim().toLowerCase();
  const locFound = found.locationFound.trim().toLowerCase();
  if (locLost === locFound) {
    location = 20;
  } else if (locLost.includes(locFound) || locFound.includes(locLost)) {
    location = 12;
  } else {
    const campusZones = [
      ['library', 'study hall', 'reading room'],
      ['cafeteria', 'canteen', 'food court', 'mess'],
      ['sports complex', 'gym', 'football field', 'stadium'],
      ['engineering block', 'lab', 'computer center'],
      ['hostel', 'dorm', 'residential hall'],
      ['administration', 'admission office', 'main block'],
    ];
    for (const zone of campusZones) {
      if (zone.some(k => locLost.includes(k)) && zone.some(k => locFound.includes(k))) {
        location = 12;
        break;
      }
    }
  }

  // 3. Date (15 pts)
  const dLost = new Date(lost.dateLost);
  const dFound = new Date(found.dateFound);
  const diffDays = Math.ceil(Math.abs(dLost.getTime() - dFound.getTime()) / (1000 * 3600 * 24));
  if (diffDays <= 1) date = 15;
  else if (diffDays <= 3) date = 10;
  else if (diffDays <= 7) date = 5;

  // 4. Keyword (20 pts)
  const similarity = calculateLocalKeywordSimilarity(
    `${lost.title} ${lost.description}`,
    `${found.title} ${found.description}`
  );
  keyword = Math.min(20, Math.round(similarity * 20));

  // 5. Fingerprint (10 pts)
  const fpSim = calculateLocalFingerprintSimilarity(lost.fingerprint, found.fingerprint);
  fingerprint = Math.round(fpSim * 10);

  // 6. Image (5 pts)
  if (lost.imageUrl && found.imageUrl) {
    image = similarity > 0.5 ? 5 : 3;
  } else if (!lost.imageUrl && !found.imageUrl) {
    image = 2; // Neutral
  }

  return category + location + date + keyword + fingerprint + image;
};

const verifyClaimAnswersLocal = (claimantAnswers: any[], secretQuestions: any[]): number => {
  if (secretQuestions.length === 0) return 100;
  let totalScore = 0;
  const weight = 100 / secretQuestions.length;

  for (const sq of secretQuestions) {
    const ca = claimantAnswers.find(
      a => a.question.trim().toLowerCase() === sq.question.trim().toLowerCase()
    );
    if (!ca) continue;

    const ans1 = ca.answer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    const ans2 = sq.answer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

    if (ans1 === ans2) {
      totalScore += weight;
    } else {
      const tokens1 = ans1.split(/\s+/);
      const tokens2 = ans2.split(/\s+/);
      const set1 = new Set(tokens1);
      const set2 = new Set(tokens2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      if (union.size > 0) {
        totalScore += (intersection.size / union.size) * weight;
      }
    }
  }
  return Math.min(100, Math.round(totalScore));
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('trustnet_api_url') || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  });
  const [showServerSettings, setShowServerSettings] = useState(false);
  const API_URL = apiUrl.replace(/\/+$/, '');

  // Custom fetch wrapper to bypass ngrok's browser warning page
  const apiFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('ngrok-skip-browser-warning', 'true');
    return fetch(input, {
      ...init,
      headers,
    });
  };

  const [backendActive, setBackendActive] = useState<boolean | null>(null);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trustnet_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ studentId: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    name: '',
    course: '',
    sex: 'Male',
    photo: '',
    password: '',
  });

  // App Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report-lost' | 'report-found' | 'active-matches' | 'profile' | 'admin-panel'>('dashboard');

  // Core Data States
  const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [trustLogs, setTrustLogs] = useState<TrustLog[]>([]);

  // Admin Specific Lists
  const [adminUsersList, setAdminUsersList] = useState<User[]>([]);
  const [adminLostList, setAdminLostList] = useState<LostItem[]>([]);
  const [adminFoundList, setAdminFoundList] = useState<FoundItem[]>([]);
  const [adminClaimsList, setAdminClaimsList] = useState<Claim[]>([]);

  // Analytics Stats
  const [stats, setStats] = useState({
    activeLost: 0,
    activeFound: 0,
    totalLost: 0,
    totalFound: 0,
    recoveredCount: 0,
    recoveryRate: 0,
    avgRecoveryHours: 4.5,
  });

  // Verification Questionnaire State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResultScore, setQuizResultScore] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Dashboard Active Reports Filters State
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardFilterType, setDashboardFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [dashboardFilterCategory, setDashboardFilterCategory] = useState('All');

  // Forms
  const [lostForm, setLostForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    locationLost: 'Library',
    dateLost: new Date().toISOString().split('T')[0],
    brand: '',
    color: '',
    size: '',
    uniqueFeatures: '',
    imageUrl: '',
  });

  const [foundForm, setFoundForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    locationFound: 'Library',
    dateFound: new Date().toISOString().split('T')[0],
    brand: '',
    color: '',
    size: '',
    uniqueFeatures: '',
    imageUrl: '',
    questions: [
      { question: 'What is the brand / make?', answer: '' },
      { question: 'What color is the item?', answer: '' },
      { question: 'Name a unique mark or detail inside/on the item:', answer: '' },
    ],
  });

  // ==========================================
  // 5. DATA SYNC & API SERVICES
  // ==========================================

  const loadData = async (userToLoad = currentUser, urlOverride?: string) => {
    const rawUrl = urlOverride || API_URL;
    const fetchUrl = rawUrl.replace(/\/+$/, '');
    try {
      const healthRes = await apiFetch(`${fetchUrl}/users`);
      if (healthRes.ok) {
        setBackendActive(true);
        const backendUsers = await healthRes.json();
        setUsers(backendUsers);

        if (userToLoad) {
          const updatedMe = backendUsers.find((u: any) => u.studentId === userToLoad.studentId);
          if (updatedMe) {
            setCurrentUser(updatedMe);
            localStorage.setItem('trustnet_user', JSON.stringify(updatedMe));
          }
        }

        // Fetch Items
        const lostRes = await apiFetch(`${fetchUrl}/items/lost`);
        const foundRes = await apiFetch(`${fetchUrl}/items/found`);
        const fetchedLost = lostRes.ok ? await lostRes.json() : [];
        const fetchedFound = foundRes.ok ? await foundRes.json() : [];
        setLostItems(fetchedLost);
        setFoundItems(fetchedFound);

        // Fetch Matches
        const matchesRes = await apiFetch(`${fetchUrl}/matches`);
        const fetchedMatches = matchesRes.ok ? await matchesRes.json() : [];
        setMatches(fetchedMatches);

        // Fetch Claims
        const claimsRes = await apiFetch(`${fetchUrl}/claims`);
        const fetchedClaims = claimsRes.ok ? await claimsRes.json() : [];
        setClaims(fetchedClaims);

        // Compute Stats
        const totalL = fetchedLost.length;
        const recoveredL = fetchedLost.filter((i: any) => i.status === 'RETURNED').length;
        const activeL = fetchedLost.filter((i: any) => i.status === 'LOST' || i.status === 'MATCHED').length;
        const activeF = fetchedFound.filter((i: any) => i.status === 'FOUND' || i.status === 'MATCHED').length;
        const recRate = totalL > 0 ? Math.round((recoveredL / totalL) * 100) : 0;

        setStats({
          activeLost: activeL,
          activeFound: activeF,
          totalLost: totalL,
          totalFound: fetchedFound.length,
          recoveredCount: recoveredL,
          recoveryRate: recRate,
          avgRecoveryHours: 4.5,
        });
        return true;
      } else {
        throw new Error('Connection failed');
      }
    } catch (e) {
      console.log('Backend offline. Using simulated local engine.');
      setBackendActive(false);
      calculateLocalState(userToLoad);
      return false;
    }
  };

  const calculateLocalState = (userToLoad = currentUser) => {
    // Stats calculation
    const totalL = lostItems.length;
    const totalF = foundItems.length;
    const recoveredL = lostItems.filter(i => i.status === 'RETURNED').length;
    const activeL = lostItems.filter(i => i.status === 'LOST' || i.status === 'MATCHED').length;
    const activeF = foundItems.filter(i => i.status === 'FOUND' || i.status === 'MATCHED').length;
    const recRate = totalL > 0 ? Math.round((recoveredL / totalL) * 100) : 0;

    setStats({
      activeLost: activeL,
      activeFound: activeF,
      totalLost: totalL,
      totalFound: totalF,
      recoveredCount: recoveredL,
      recoveryRate: recRate,
      avgRecoveryHours: 4.5,
    });

    // Run matching locally
    const localMatches: Match[] = [];
    const activeLItems = lostItems.filter(i => i.status !== 'RETURNED');
    const activeFItems = foundItems.filter(i => i.status !== 'RETURNED');

    for (const lost of activeLItems) {
      for (const found of activeFItems) {
        const score = calculateLocalMatchScore(lost, found);
        if (score >= 70) {
          const matchingClaims = claims.filter(c => c.matchId === `${lost.id}-${found.id}`);
          localMatches.push({
            id: `${lost.id}-${found.id}`,
            lostItemId: lost.id,
            lostItem: { ...lost, owner: users.find(u => u.id === lost.ownerId) || currentUser || undefined },
            foundItemId: found.id,
            foundItem: { ...found, finder: users.find(u => u.id === found.finderId) || undefined },
            score,
            status: matchingClaims.some(c => c.status === 'APPROVED') ? 'RESOLVED' : 'PENDING',
            createdAt: new Date().toISOString(),
            claims: matchingClaims,
          });
        }
      }
    }
    setMatches(localMatches);

    // Sync logged in user profile details
    if (userToLoad) {
      const updatedUser = users.find(u => u.studentId === userToLoad.studentId);
      if (updatedUser) {
        const userLogs = trustLogs.filter(log => log.userId === updatedUser.id);
        const scoreSum = userLogs.reduce((sum, l) => sum + l.scoreChange, 100);
        const synced = {
          ...updatedUser,
          trustScore: Math.max(0, scoreSum),
          trustLogs: userLogs,
          _count: {
            lostItems: lostItems.filter(i => i.ownerId === updatedUser.id).length,
            foundItems: foundItems.filter(i => i.finderId === updatedUser.id).length,
            claims: claims.filter(c => c.claimantId === updatedUser.id).length,
          }
        };
        setCurrentUser(synced);
        localStorage.setItem('trustnet_user', JSON.stringify(synced));
      }
    }
  };

  const loadAdminData = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    if (backendActive) {
      try {
        const usersRes = await apiFetch(`${API_URL}/users`);
        const claimsRes = await apiFetch(`${API_URL}/claims`);
        const lostRes = await apiFetch(`${API_URL}/items/lost`);
        const foundRes = await apiFetch(`${API_URL}/items/found`);
        if (usersRes.ok) setAdminUsersList(await usersRes.json());
        if (claimsRes.ok) setAdminClaimsList(await claimsRes.json());
        if (lostRes.ok) setAdminLostList(await lostRes.json());
        if (foundRes.ok) setAdminFoundList(await foundRes.json());
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    } else {
      setAdminUsersList(users);
      setAdminClaimsList(claims);
      setAdminLostList(lostItems);
      setAdminFoundList(foundItems);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (backendActive === false) {
      calculateLocalState();
    }
  }, [lostItems, foundItems, claims, trustLogs, backendActive]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [currentUser, activeTab, users, claims, lostItems, foundItems]);

  // ==========================================
  // 6. ACTION HANDLERS
  // ==========================================

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegisterForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.studentId || !loginForm.password) {
      alert('Please fill in all credentials.');
      return;
    }

    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm),
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          localStorage.setItem('trustnet_user', JSON.stringify(user));
          setLoginForm({ studentId: '', password: '' });
          setActiveTab('dashboard');
          setActiveNotification(`Welcome back, ${user.name}!`);
          setTimeout(() => setActiveNotification(null), 4000);
        } else {
          const err = await res.json();
          alert(err.message || 'Invalid credentials');
        }
      } catch (err) {
        console.error('Backend auth failed:', err);
        handleLocalLogin();
      }
    } else {
      handleLocalLogin();
    }
  };

  const handleLocalLogin = () => {
    const target = users.find(
      u => u.studentId.toLowerCase() === loginForm.studentId.toLowerCase() && u.password === loginForm.password
    );
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('trustnet_user', JSON.stringify(target));
      setLoginForm({ studentId: '', password: '' });
      setActiveTab('dashboard');
      setActiveNotification(`Logged in locally as ${target.name}`);
      setTimeout(() => setActiveNotification(null), 4000);
    } else {
      alert('Invalid username or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.studentId || !registerForm.name || !registerForm.course || !registerForm.password) {
      alert('Please fill in all details.');
      return;
    }

    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerForm),
        });
        if (res.ok) {
          const user = await res.json();
          alert('Registration successful! Please sign in. The administrator will review and verify your account details.');
          setAuthMode('login');
          setLoginForm({ studentId: user.studentId, password: registerForm.password });
        } else {
          const err = await res.json();
          alert(err.message || 'Registration failed');
        }
      } catch (err) {
        console.error('Backend registration failed:', err);
        handleLocalRegister();
      }
    } else {
      handleLocalRegister();
    }
  };

  const handleLocalRegister = () => {
    const existing = users.find(u => u.studentId.toLowerCase() === registerForm.studentId.toLowerCase());
    if (existing) {
      alert('User with this ID number already exists.');
      return;
    }
    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      studentId: registerForm.studentId,
      name: registerForm.name,
      email: `${registerForm.studentId}@university.edu`,
      course: registerForm.course,
      photo: registerForm.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
      sex: registerForm.sex,
      password: registerForm.password,
      isVerified: false,
      trustScore: 100,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    alert('Local account created successfully! It is pending administrator verification.');
    setAuthMode('login');
    setLoginForm({ studentId: newUser.studentId, password: registerForm.password });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('trustnet_user');
    setActiveTab('dashboard');
    setActiveNotification('Logged out successfully.');
    setTimeout(() => setActiveNotification(null), 4000);
  };

  const handleReportLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentUser.isVerified && currentUser.role !== 'ADMIN') {
      alert('Your account must be verified before submitting reports.');
      return;
    }

    const body = {
      title: lostForm.title,
      description: lostForm.description,
      category: lostForm.category,
      locationLost: lostForm.locationLost,
      dateLost: lostForm.dateLost,
      brand: lostForm.brand,
      color: lostForm.color,
      size: lostForm.size,
      uniqueFeatures: lostForm.uniqueFeatures,
      imageUrl: lostForm.imageUrl || undefined,
    };

    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/items/lost/${currentUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          loadData();
          setActiveTab('dashboard');
          resetLostForm();
          setActiveNotification('Lost item report submitted! Finding matches...');
          setTimeout(() => setActiveNotification(null), 5000);
        }
      } catch (err) {
        console.error('Backend submit failed:', err);
        submitLostLocal(body);
      }
    } else {
      submitLostLocal(body);
    }
  };

  const submitLostLocal = (body: any) => {
    const clean = (val?: string) => (val ? val.trim().toUpperCase().replace(/\s+/g, '') : 'ANY');
    const fingerprint = `${clean(body.category)}-${clean(body.brand)}-${clean(body.color)}-${clean(body.size)}-${clean(body.uniqueFeatures)}`;

    const newLost: LostItem = {
      id: 'l-' + Math.random().toString(36).substring(2, 9),
      ownerId: currentUser!.id,
      owner: currentUser!,
      title: body.title,
      description: body.description,
      category: body.category,
      locationLost: body.locationLost,
      dateLost: body.dateLost,
      imageUrl: body.imageUrl,
      status: 'LOST',
      fingerprint,
      createdAt: new Date().toISOString(),
    };

    setLostItems(prev => [newLost, ...prev]);
    setActiveTab('dashboard');
    resetLostForm();
    setActiveNotification('Lost item reported locally! Matching engine is running.');
    setTimeout(() => setActiveNotification(null), 5000);
  };

  const resetLostForm = () => {
    setLostForm({
      title: '',
      description: '',
      category: 'Electronics',
      locationLost: 'Library',
      dateLost: new Date().toISOString().split('T')[0],
      brand: '',
      color: '',
      size: '',
      uniqueFeatures: '',
      imageUrl: '',
    });
  };

  const handleReportFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentUser.isVerified && currentUser.role !== 'ADMIN') {
      alert('Your account must be verified before submitting reports.');
      return;
    }

    const activeQuestions = foundForm.questions.filter(q => q.question && q.answer);
    const body = {
      title: foundForm.title,
      description: foundForm.description,
      category: foundForm.category,
      locationFound: foundForm.locationFound,
      dateFound: foundForm.dateFound,
      brand: foundForm.brand,
      color: foundForm.color,
      size: foundForm.size,
      uniqueFeatures: foundForm.uniqueFeatures,
      imageUrl: foundForm.imageUrl || undefined,
      secretQuestions: activeQuestions,
    };

    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/items/found/${currentUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          loadData();
          setActiveTab('dashboard');
          resetFoundForm();
          setActiveNotification('Found item listed! System is calculating similarity scores...');
          setTimeout(() => setActiveNotification(null), 5000);
        }
      } catch (err) {
        console.error(err);
        submitFoundLocal(body);
      }
    } else {
      submitFoundLocal(body);
    }
  };

  const submitFoundLocal = (body: any) => {
    const clean = (val?: string) => (val ? val.trim().toUpperCase().replace(/\s+/g, '') : 'ANY');
    const fingerprint = `${clean(body.category)}-${clean(body.brand)}-${clean(body.color)}-${clean(body.size)}-${clean(body.uniqueFeatures)}`;

    const newFound: FoundItem = {
      id: 'f-' + Math.random().toString(36).substring(2, 9),
      finderId: currentUser!.id,
      finder: currentUser!,
      title: body.title,
      description: body.description,
      category: body.category,
      locationFound: body.locationFound,
      dateFound: body.dateFound,
      imageUrl: body.imageUrl,
      status: 'FOUND',
      fingerprint,
      secretQuestions: body.secretQuestions,
      createdAt: new Date().toISOString(),
    };

    setFoundItems(prev => [newFound, ...prev]);
    setActiveTab('dashboard');
    resetFoundForm();
    setActiveNotification('Found item reported locally! Matching engine is running.');
    setTimeout(() => setActiveNotification(null), 5000);
  };

  const resetFoundForm = () => {
    setFoundForm({
      title: '',
      description: '',
      category: 'Electronics',
      locationFound: 'Library',
      dateFound: new Date().toISOString().split('T')[0],
      brand: '',
      color: '',
      size: '',
      uniqueFeatures: '',
      imageUrl: '',
      questions: [
        { question: 'What is the brand / make?', answer: '' },
        { question: 'What color is the item?', answer: '' },
        { question: 'Name a unique mark or detail inside/on the item:', answer: '' },
      ],
    });
  };

  const handleSubmitQuiz = async () => {
    if (!selectedMatch || !currentUser) return;

    const formattedAnswers = Object.entries(quizAnswers).map(([question, answer]) => ({
      question,
      answer,
    }));

    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/claims/${currentUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: selectedMatch.id,
            answers: formattedAnswers,
          }),
        });
        if (res.ok) {
          const claimResult = await res.json();
          setQuizResultScore(claimResult.verificationScore);
          setQuizSubmitted(true);
          setQuizStatus(claimResult.status);
          loadData();
          setActiveNotification(`Claim processed! Status: ${claimResult.status}`);
          setTimeout(() => setActiveNotification(null), 5000);
        }
      } catch (err) {
        console.error(err);
        submitQuizLocal(formattedAnswers);
      }
    } else {
      submitQuizLocal(formattedAnswers);
    }
  };

  const submitQuizLocal = (formattedAnswers: any[]) => {
    if (!selectedMatch || !currentUser) return;

    const secretQuestions = selectedMatch.foundItem.secretQuestions || [];
    const score = verifyClaimAnswersLocal(formattedAnswers, secretQuestions);

    setQuizResultScore(score);
    setQuizSubmitted(true);

    const newClaimId = 'c-' + Math.random().toString(36).substring(2, 9);
    const newClaim: Claim = {
      id: newClaimId,
      matchId: selectedMatch.id,
      claimantId: currentUser.id,
      claimant: currentUser,
      verificationScore: score,
      answers: formattedAnswers,
      status: score >= 70 ? 'APPROVED' : 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setClaims(prev => [...prev, newClaim]);

    if (score >= 70) {
      setQuizStatus('APPROVED');
      setLostItems(prev => prev.map(item => item.id === selectedMatch.lostItemId ? { ...item, status: 'RETURNED' } : item));
      setFoundItems(prev => prev.map(item => item.id === selectedMatch.foundItemId ? { ...item, status: 'RETURNED' } : item));

      const newLogs: TrustLog[] = [
        {
          id: 'log-o-' + Math.random().toString(36).substring(2, 9),
          userId: selectedMatch.lostItem.ownerId,
          scoreChange: 10,
          reason: `Successfully recovered lost item [${selectedMatch.lostItem.title}]`,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'log-f-' + Math.random().toString(36).substring(2, 9),
          userId: selectedMatch.foundItem.finderId,
          scoreChange: 10,
          reason: `Successfully returned found item [${selectedMatch.foundItem.title}] to its owner`,
          createdAt: new Date().toISOString(),
        }
      ];

      setTrustLogs(prev => [...prev, ...newLogs]);
      setActiveNotification(`Ownership verified (${score}%) - Claim Approved!`);
    } else {
      setQuizStatus('PENDING');
      if (score < 20) {
        const penaltyLog: TrustLog = {
          id: 'log-p-' + Math.random().toString(36).substring(2, 9),
          userId: currentUser.id,
          scoreChange: -15,
          reason: `Failed ownership verification for claim on [${selectedMatch.foundItem.title}] (Score: ${score}%)`,
          createdAt: new Date().toISOString(),
        };
        setTrustLogs(prev => [...prev, penaltyLog]);
        setActiveNotification(`Claim rejected (${score}%). -15 Trust Points penalty.`);
      } else {
        setActiveNotification(`Claim submitted for review (${score}%).`);
      }
    }
    setTimeout(() => setActiveNotification(null), 5000);
  };

  // ==========================================
  // 7. ADMIN SUPERUSER CONTROLS
  // ==========================================

  const handleVerifyUser = async (userId: string) => {
    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/users/${userId}/verify`, { method: 'POST' });
        if (res.ok) {
          loadAdminData();
          loadData();
          setActiveNotification('User account verified successfully!');
          setTimeout(() => setActiveNotification(null), 4000);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: true } : u));
      setActiveNotification('User verified locally!');
      setTimeout(() => setActiveNotification(null), 4000);
    }
  };

  const handleDenyUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deny and delete this user?')) return;
    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          loadAdminData();
          loadData();
          setActiveNotification('User account deleted.');
          setTimeout(() => setActiveNotification(null), 4000);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActiveNotification('User deleted locally.');
      setTimeout(() => setActiveNotification(null), 4000);
    }
  };

  const handleDeleteItem = async (type: 'lost' | 'found', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type} item report?`)) return;
    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/items/${type}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadAdminData();
          loadData();
          setActiveNotification('Report deleted successfully.');
          setTimeout(() => setActiveNotification(null), 4000);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (type === 'lost') setLostItems(prev => prev.filter(i => i.id !== id));
      else setFoundItems(prev => prev.filter(i => i.id !== id));
      setActiveNotification('Report deleted locally.');
      setTimeout(() => setActiveNotification(null), 4000);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to delete this claim?')) return;
    if (backendActive) {
      try {
        const res = await apiFetch(`${API_URL}/claims/${claimId}`, { method: 'DELETE' });
        if (res.ok) {
          loadAdminData();
          loadData();
          setActiveNotification('Claim deleted successfully.');
          setTimeout(() => setActiveNotification(null), 4000);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setClaims(prev => prev.filter(c => c.id !== claimId));
      setActiveNotification('Claim deleted locally.');
      setTimeout(() => setActiveNotification(null), 4000);
    }
  };

  // UI helpers
  const getTrustTier = (score: number) => {
    if (score >= 130) return { name: 'Campus Hero', color: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/30' };
    if (score >= 115) return { name: 'Gold Finder', color: 'text-amber-400 bg-amber-950/40 border border-amber-500/30' };
    if (score >= 100) return { name: 'Silver Finder', color: 'text-slate-300 bg-slate-800/40 border border-slate-700/30' };
    if (score >= 85) return { name: 'Bronze Finder', color: 'text-orange-400 bg-orange-950/40 border border-orange-500/30' };
    return { name: 'Under Probation', color: 'text-red-400 bg-red-950/40 border border-red-500/30' };
  };

  // Verification checks
  const isPendingVerification = currentUser && currentUser.role !== 'ADMIN' && !currentUser.isVerified;

  // Merge and filter active reports (status is not RETURNED)
  const getFilteredReports = () => {
    const normalizedLost = lostItems
      .filter(item => item.status !== 'RETURNED')
      .map(item => ({
        ...item,
        type: 'lost' as const,
        location: item.locationLost,
        date: item.dateLost,
      }));

    const normalizedFound = foundItems
      .filter(item => item.status !== 'RETURNED')
      .map(item => ({
        ...item,
        type: 'found' as const,
        location: item.locationFound,
        date: item.dateFound,
      }));

    let combined = [...normalizedLost, ...normalizedFound];

    // Search query filter
    if (dashboardSearch.trim()) {
      const query = dashboardSearch.toLowerCase();
      combined = combined.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (dashboardFilterType !== 'all') {
      combined = combined.filter(item => item.type === dashboardFilterType);
    }

    // Category filter
    if (dashboardFilterCategory !== 'All') {
      combined = combined.filter(
        item => item.category.toLowerCase() === dashboardFilterCategory.toLowerCase()
      );
    }

    // Sort by createdAt descending
    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const filteredReports = getFilteredReports();

  const handleClaimItemClick = (item: any) => {
    const foundMatch = matches.find(m => m.foundItemId === item.id && m.lostItem.ownerId === currentUser?.id);
    if (foundMatch) {
      setSelectedMatch(foundMatch);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResultScore(null);
      setQuizStatus(null);
      setActiveTab('active-matches');
      setActiveNotification('Match detected! Opening ownership verification quiz.');
      setTimeout(() => setActiveNotification(null), 4000);
    } else {
      setLostForm(prev => ({
        ...prev,
        category: item.category,
        locationLost: item.location,
        title: `Lost ${item.title}`,
        description: `Matching details for reported found item: ${item.description}`,
      }));
      setActiveTab('report-lost');
      setActiveNotification('No active match found. Prefilling details to report your lost item.');
      setTimeout(() => setActiveNotification(null), 4000);
    }
  };

  const handleFoundItemClick = (item: any) => {
    setFoundForm(prev => ({
      ...prev,
      category: item.category,
      locationFound: item.location,
      title: `Found ${item.title}`,
      description: `Matching details for reported lost item: ${item.description}`,
    }));
    setActiveTab('report-found');
    setActiveNotification('Prefilling details to report the found item.');
    setTimeout(() => setActiveNotification(null), 4000);
  };

  // ==========================================
  // 8. RENDER AUTHENTICATION VIEW (PORTAL)
  // ==========================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {activeNotification && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl border border-indigo-500/30 bg-slate-900/90 backdrop-blur-md shadow-2xl animate-glow transition-all max-w-md flex items-start gap-3 animate-slide-in">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-100">System Notification</h4>
              <p className="text-xs text-slate-300 mt-0.5">{activeNotification}</p>
            </div>
          </div>
        )}

        {/* Decorative background grids/glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950 z-0"></div>

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">

          {/* Server Settings Gear on Login Page */}
          <div className="absolute top-6 right-6">
            <div className="relative">
              <button
                onClick={() => setShowServerSettings(!showServerSettings)}
                className={`p-2 rounded-xl border border-slate-800/80 bg-slate-950 text-indigo-400 hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer ${showServerSettings ? 'ring-1 ring-indigo-500' : ''}`}
                title="Server Connection Settings"
              >
                ⚙
              </button>

              {showServerSettings && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl z-30 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-200">Server Connection Settings</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Backend API URL</label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://localhost:3000"
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between gap-2 mt-1">
                    <button
                      onClick={() => setShowServerSettings(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={async () => {
                        localStorage.setItem('trustnet_api_url', apiUrl);
                        setActiveNotification('Testing API connection...');
                        const success = await loadData(currentUser, apiUrl);
                        if (success) {
                          setActiveNotification('Successfully connected to backend database!');
                          setShowServerSettings(false);
                        } else {
                          setActiveNotification('Failed to connect to backend database. Offline mode active.');
                        }
                        setTimeout(() => setActiveNotification(null), 5000);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Save & Reconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="font-display font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TrustNet Login Portal
            </h1>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">
              Campus Recovery Network
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student ID or Username</label>
                <input
                  type="text"
                  required
                  value={loginForm.studentId}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="e.g. STU1001"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15 hover:scale-[1.01] cursor-pointer"
              >
                Sign In to Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Number / Username</label>
                <input
                  type="text"
                  required
                  value={registerForm.studentId}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="e.g. STU1001"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course</label>
                <input
                  type="text"
                  required
                  value={registerForm.course}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, course: e.target.value }))}
                  placeholder="Computer Science"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sex</label>
                  <select
                    value={registerForm.sex}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, sex: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-400 focus:outline-none cursor-pointer"
                />
                <input
                  type="text"
                  value={registerForm.photo.startsWith('data:') ? '' : registerForm.photo}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, photo: e.target.value }))}
                  placeholder="Or paste image URL instead..."
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-[10px] text-slate-100 focus:outline-none mt-1"
                />
                {registerForm.photo && (
                  <div className="mt-2 flex items-center justify-center">
                    <img
                      src={registerForm.photo}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Sync indicator */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
            <span>Server:</span>
            {backendActive ? (
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                Simulated Demo Mode
              </span>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // 9. RENDER MAIN APPLICATION VIEW
  // ==========================================

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-100 bg-slate-950 font-sans relative">

      {/* 9.1. ALERT BANNER */}
      {activeNotification && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl border border-indigo-500/30 bg-slate-900/90 backdrop-blur-md shadow-2xl animate-glow transition-all max-w-md flex items-start gap-3 animate-slide-in">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-100">System Notification</h4>
            <p className="text-xs text-slate-300 mt-0.5">{activeNotification}</p>
          </div>
        </div>
      )}

      {/* 9.2. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900/40 border-r border-slate-800/80 flex flex-col p-6 shrink-0 z-10 backdrop-blur-md">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TrustNet
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest block">
              Campus Recovery
            </span>
          </div>
        </div>

        {/* Logged User Profile */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-8 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            {currentUser.photo ? (
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs truncate text-slate-100">{currentUser.name}</h3>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase mt-1 inline-block ${getTrustTier(currentUser.trustScore).color}`}>
                {getTrustTier(currentUser.trustScore).name}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">ID Number:</span>
            <span className="font-mono text-slate-200 font-bold">{currentUser.studentId}</span>
          </div>

          {currentUser.course && (
            <div className="pt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Course:</span>
              <span className="text-slate-200 font-semibold truncate w-24 text-right">{currentUser.course}</span>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
              <span>Trust Score</span>
              <span className="font-bold text-indigo-400">{currentUser.trustScore} pts</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{ width: `${Math.min(100, (currentUser.trustScore / 150) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className="flex-grow flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setActiveTab('report-lost')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'report-lost'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            ➕ Report Lost Item
          </button>

          <button
            onClick={() => setActiveTab('report-found')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'report-found'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            📋 Report Found Item
          </button>

          <button
            onClick={() => setActiveTab('active-matches')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${activeTab === 'active-matches'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            🔄 Matches & Claims
            {matches.filter(m => m.status === 'PENDING').length > 0 && (
              <span className="absolute right-4 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">
                {matches.filter(m => m.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            👤 My Profile
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin-panel')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'admin-panel'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/15'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-slate-900/40'
                }`}
            >
              💼 Admin Panel
            </button>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-left cursor-pointer"
          >
            🚪 Logout Session
          </button>

          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <span>Database:</span>
            {backendActive ? (
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Synced
              </span>
            ) : (
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                Offline
              </span>
            )}
          </div>
        </div>

      </aside>

      {/* 9.3. MAIN CONTENT CONTAINER */}
      <main className="flex-grow flex flex-col min-w-0 z-0">

        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 md:px-8 z-20">
          <h2 className="font-display font-bold text-base text-slate-100">
            {activeTab === 'dashboard' && 'Campus Dashboard'}
            {activeTab === 'report-lost' && 'Intelligent Lost Report Wizard'}
            {activeTab === 'report-found' && 'Intelligent Found Report Wizard'}
            {activeTab === 'active-matches' && 'Matching Engine Outcomes'}
            {activeTab === 'profile' && 'Student Trust Account'}
            {activeTab === 'admin-panel' && 'Campus Security Administrator Panel'}
          </h2>

          <div className="flex items-center gap-3">
            {/* SERVER CONNECTION SETTINGS */}
            <div className="relative">
              <button
                onClick={() => setShowServerSettings(!showServerSettings)}
                className={`p-2 rounded-xl border border-slate-800/80 bg-slate-900 text-indigo-400 hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer ${showServerSettings ? 'ring-1 ring-indigo-500' : ''
                  }`}
                title="Server Connection Settings"
              >
                ⚙
              </button>

              {showServerSettings && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl z-30 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-200">Server Connection Settings</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Backend API URL</label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://localhost:3000"
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between gap-2 mt-1">
                    <button
                      onClick={() => setShowServerSettings(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={async () => {
                        localStorage.setItem('trustnet_api_url', apiUrl);
                        setActiveNotification('Testing API connection...');
                        const success = await loadData(currentUser, apiUrl);
                        if (success) {
                          setActiveNotification('Successfully connected to backend database!');
                          setShowServerSettings(false);
                        } else {
                          setActiveNotification('Failed to connect to backend database. Offline mode active.');
                        }
                        setTimeout(() => setActiveNotification(null), 5000);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Save & Reconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8">

          {/* 9.4. VERIFICATION WARNING BANNER */}
          {isPendingVerification && (
            <div className="bg-amber-600/20 border border-amber-500/30 text-amber-300 p-4 rounded-xl mb-6 text-xs flex items-start gap-3">
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <strong className="font-bold block text-sm">Account Verification Pending</strong>
                <span className="text-slate-300 mt-1 block">
                  Your registration details are currently pending verification by Campus Security Administrators.
                  You can view existing reports and matches, but you will not be able to report items or submit verification claims until your account is approved.
                </span>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: DASHBOARD
              ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8">

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery Success</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-100 mt-1">{stats.recoveryRate}%</h3>
                    <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                      ✓ {stats.recoveredCount} returned items
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Reports</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-100 mt-1">{stats.activeLost + stats.activeFound}</h3>
                    <p className="text-[10px] text-slate-400 mt-2">
                      <span className="text-rose-400">{stats.activeLost} Lost</span> • <span className="text-emerald-400">{stats.activeFound} Found</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Recovery Speed</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-100 mt-1">{stats.avgRecoveryHours} hrs</h3>
                    <p className="text-[10px] text-slate-400 mt-2">Ownership verification time</p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Trust score</span>
                    <h3 className="font-display font-extrabold text-2xl text-indigo-400 mt-1">{currentUser.trustScore}</h3>
                    <p className="text-[10px] text-slate-300 mt-2">
                      Rank: <strong>{getTrustTier(currentUser.trustScore).name}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Map & Leaderboard */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Hotspot Map */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl xl:col-span-2 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                      Interactive Campus Risk & Recovery Heatmap
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Visualizing loss/found density by zone. Hover over circles for stats.
                    </p>
                  </div>

                  <div className="relative flex-grow flex items-center justify-center min-h-[300px] border border-slate-800/60 rounded-xl bg-slate-900/30 overflow-hidden p-4">
                    <svg viewBox="0 0 100 100" className="w-full max-w-[400px] h-auto text-slate-800">
                      <path d="M15 0 L15 100 M50 0 L50 100 M85 0 L85 100 M0 35 L100 35 M0 70 L100 70" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />

                      <rect x="25" y="15" width="20" height="20" rx="2" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                      <text x="35" y="27" fontSize="2.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">LIBRARY</text>

                      <rect x="55" y="15" width="22" height="15" rx="2" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                      <text x="66" y="24" fontSize="2.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">ENG BLOCK</text>

                      <rect x="58" y="42" width="18" height="12" rx="2" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                      <text x="67" y="49" fontSize="2.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">CAFETERIA</text>

                      <rect x="15" y="55" width="25" height="30" rx="2" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                      <text x="27" y="72" fontSize="2.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">SPORTS CMPLX</text>

                      <g className="cursor-pointer">
                        <circle cx="35" cy="25" r="7" fill="rgba(239, 68, 68, 0.25)" className="animate-pulse" />
                        <circle cx="35" cy="25" r="3" fill="#ef4444" />
                      </g>

                      <g className="cursor-pointer">
                        <circle cx="67" cy="48" r="6" fill="rgba(16, 185, 129, 0.2)" className="animate-pulse" />
                        <circle cx="67" cy="48" r="2.5" fill="#10b981" />
                      </g>
                    </svg>

                    <div className="absolute bottom-4 left-4 flex flex-col gap-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[9px]">
                      <span className="font-semibold text-slate-300">Activity Levels</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                        <span>Library (Loss Hotspot)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Cafeteria (Recovery Hotspot)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Score Leaderboard */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2">
                      🏆 Trust Score Leaderboard
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Gamified student ranks based on verified recoveries.
                    </p>
                  </div>

                  <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                    {users
                      .sort((a, b) => b.trustScore - a.trustScore)
                      .map((u, idx) => {
                        const isMe = u.id === currentUser.id;
                        return (
                          <div
                            key={u.id}
                            className={`p-3 rounded-xl flex items-center justify-between border transition-all ${isMe
                                ? 'bg-indigo-600/10 border-indigo-500/40'
                                : 'bg-slate-950/40 border-slate-800/40 hover:bg-slate-900/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black w-5 text-slate-400">
                                {idx === 0 ? '👑' : idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-xs text-slate-200">
                                  {u.name} {isMe && <span className="text-[8px] bg-indigo-600 px-1 rounded text-white ml-1">You</span>}
                                </h4>
                                <span className="text-[9px] text-slate-400">
                                  {getTrustTier(u.trustScore).name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-100">{u.trustScore}</span>
                              <span className="text-[8px] text-slate-500 block uppercase font-mono">Pts</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

              {/* Active Campus Reports Feed */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2 text-sm">
                      📢 Active Campus Reports Feed
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Browse all active lost and found items currently reported on campus.
                    </p>
                  </div>

                  {/* Search and Category Filters */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={dashboardSearch}
                      onChange={(e) => setDashboardSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none text-slate-200 w-full sm:w-[150px]"
                    />

                    <select
                      value={dashboardFilterCategory}
                      onChange={(e) => setDashboardFilterCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none text-slate-200 cursor-pointer w-full sm:w-auto"
                    >
                      <option value="All">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents</option>
                      <option value="Keys">Keys</option>
                      <option value="Personal Items">Personal Items</option>
                      <option value="Bags & Backpacks">Bags & Backpacks</option>
                    </select>

                    <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 w-full sm:w-auto justify-center">
                      <button
                        type="button"
                        onClick={() => setDashboardFilterType('all')}
                        className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                          dashboardFilterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashboardFilterType('lost')}
                        className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                          dashboardFilterType === 'lost' ? 'bg-rose-600/20 text-rose-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Lost
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashboardFilterType('found')}
                        className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                          dashboardFilterType === 'found' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Found
                      </button>
                    </div>
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="border border-dashed border-slate-800/80 rounded-xl p-8 text-center text-slate-500 text-xs">
                    No active reports match the criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredReports.map((item) => {
                      const reporter = item.type === 'lost'
                        ? (item.owner || users.find((u: any) => u.id === item.ownerId) || currentUser)
                        : (item.finder || users.find((u: any) => u.id === item.finderId));
                      const isMyReport = reporter?.id === currentUser?.id;

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between transition-all group glass-panel-hover"
                        >
                          <div className="flex flex-col gap-3.5">
                            {/* Header details: Status Tag and Date */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                  item.type === 'lost'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                }`}
                              >
                                {item.type === 'lost' ? 'LOST' : 'FOUND'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Image Preview Container */}
                            {item.imageUrl ? (
                              <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900 flex items-center justify-center relative">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded-xl border border-slate-800/40 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600 gap-1">
                                <span className="text-xl">
                                  {item.category === 'Electronics' ? '💻' :
                                   item.category === 'Documents' ? '📄' :
                                   item.category === 'Keys' ? '🔑' :
                                   item.category === 'Bags & Backpacks' ? '🎒' : '📦'}
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                  {item.category}
                                </span>
                              </div>
                            )}

                            {/* Text Info */}
                            <div>
                              <h4 className="font-bold text-xs text-slate-200 group-hover:text-white transition-all line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3.5 text-[9px] text-slate-500 font-medium">
                                <span className="flex items-center gap-0.5">
                                  📍 {item.location}
                                </span>
                                <span>•</span>
                                <span className="bg-slate-900/80 border border-slate-800/60 px-1.5 py-0.2 rounded text-[8px]">
                                  {item.category}
                                </span>
                                {item.fingerprint && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-600 font-mono truncate max-w-[120px]" title={item.fingerprint}>
                                      ⚙️ {item.fingerprint.split('-').filter((x: string) => x !== 'ANY').join('/') || 'Basic'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Details & Action Button */}
                          <div className="border-t border-slate-800/40 pt-3.5 mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-bold text-[8px] text-indigo-400 uppercase">
                                {reporter?.name ? reporter.name.split(' ').map((n: string) => n[0]).join('') : 'A'}
                              </div>
                              <div className="leading-none">
                                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                  {reporter?.name || 'Anonymous'}
                                  {isMyReport && (
                                    <span className="text-[7px] bg-indigo-600 text-white px-1 py-0.2 rounded-sm font-semibold">
                                      You
                                    </span>
                                  )}
                                </span>
                                {reporter && (
                                  <span className="text-[8px] text-slate-500 mt-0.5 block font-mono">
                                    Trust: {reporter.trustScore} ({getTrustTier(reporter.trustScore).name})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Trigger */}
                            {isMyReport ? (
                              <span className="text-[9px] text-slate-500 italic">Your report</span>
                            ) : item.type === 'found' ? (
                              <button
                                onClick={() => handleClaimItemClick(item)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                              >
                                Claim Item
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFoundItemClick(item)}
                                className="px-2.5 py-1 hover:bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                              >
                                I Found This
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: REPORT LOST
              ========================================== */}
          {activeTab === 'report-lost' && (
            <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-indigo-500"></div>

              <div className="mb-6">
                <h3 className="font-display font-bold text-lg text-slate-100">Create Loss Report</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in the details. The system will auto-generate item characteristics fingerprints for match scoring.
                </p>
              </div>

              {isPendingVerification ? (
                <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                  🔒 Your account must be verified before submitting reports. Please wait for an administrator to approve your details.
                </div>
              ) : (
                <form onSubmit={handleReportLost} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Title</label>
                      <input
                        type="text" required
                        value={lostForm.title}
                        onChange={(e) => setLostForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., iPhone 15 Pro, Moleskine Notebook"
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                      <select
                        value={lostForm.category}
                        onChange={(e) => setLostForm(prev => ({ ...prev, category: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      >
                        <option>Electronics</option>
                        <option>Documents</option>
                        <option>Keys</option>
                        <option>Personal Items</option>
                        <option>Bags & Backpacks</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Description</label>
                    <textarea
                      required rows={3}
                      value={lostForm.description}
                      onChange={(e) => setLostForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Include details like stickers, scratches, or other specific marks."
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Lost</label>
                      <select
                        value={lostForm.locationLost}
                        onChange={(e) => setLostForm(prev => ({ ...prev, locationLost: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      >
                        <option>Library</option>
                        <option>Engineering Block</option>
                        <option>Cafeteria</option>
                        <option>Sports Complex</option>
                        <option>Hostels</option>
                        <option>Administration</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Lost</label>
                      <input
                        type="date" required
                        value={lostForm.dateLost}
                        onChange={(e) => setLostForm(prev => ({ ...prev, dateLost: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Fingerprint Specifications (Advanced Matching)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <input
                        type="text" placeholder="Brand (e.g. Apple)"
                        value={lostForm.brand}
                        onChange={(e) => setLostForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Color (e.g. Blue)"
                        value={lostForm.color}
                        onChange={(e) => setLostForm(prev => ({ ...prev, color: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Size (e.g. 15-inch)"
                        value={lostForm.size}
                        onChange={(e) => setLostForm(prev => ({ ...prev, size: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Unique Markings"
                        value={lostForm.uniqueFeatures}
                        onChange={(e) => setLostForm(prev => ({ ...prev, uniqueFeatures: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Photo URL (Optional)</label>
                    <input
                      type="text"
                      value={lostForm.imageUrl}
                      onChange={(e) => setLostForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="e.g. https://images.unsplash.com/... or leave empty"
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-3 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/15 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    Submit Lost Report
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==========================================
              TAB: REPORT FOUND
              ========================================== */}
          {activeTab === 'report-found' && (
            <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>

              <div className="mb-6">
                <h3 className="font-display font-bold text-lg text-slate-100">Create Found Report</h3>
                <p className="text-xs text-slate-400 mt-1">
                  List items found on campus. Note that you must provide secret questions that only the true owner would know.
                </p>
              </div>

              {isPendingVerification ? (
                <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                  🔒 Your account must be verified before submitting reports. Please wait for an administrator to approve your details.
                </div>
              ) : (
                <form onSubmit={handleReportFound} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Title</label>
                      <input
                        type="text" required
                        value={foundForm.title}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Backpack, Charger"
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                      <select
                        value={foundForm.category}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, category: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      >
                        <option>Electronics</option>
                        <option>Documents</option>
                        <option>Keys</option>
                        <option>Personal Items</option>
                        <option>Bags & Backpacks</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                    <textarea
                      required rows={3}
                      value={foundForm.description}
                      onChange={(e) => setFoundForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="State where you found the item, but DO NOT reveal the secret details."
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Found</label>
                      <select
                        value={foundForm.locationFound}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, locationFound: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      >
                        <option>Library</option>
                        <option>Engineering Block</option>
                        <option>Cafeteria</option>
                        <option>Sports Complex</option>
                        <option>Hostels</option>
                        <option>Administration</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Found</label>
                      <input
                        type="date" required
                        value={foundForm.dateFound}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, dateFound: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Fingerprint Specifications (Helper Fields)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <input
                        type="text" placeholder="Brand"
                        value={foundForm.brand}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Color"
                        value={foundForm.color}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, color: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Size"
                        value={foundForm.size}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, size: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text" placeholder="Unique Markings"
                        value={foundForm.uniqueFeatures}
                        onChange={(e) => setFoundForm(prev => ({ ...prev, uniqueFeatures: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Secret Questions */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🔒 Ownership Verification Questions</span>
                    <p className="text-[10px] text-slate-400">These will be asked to anyone trying to claim this item.</p>

                    {foundForm.questions.map((q, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => {
                            const newQs = [...foundForm.questions];
                            newQs[idx].question = e.target.value;
                            setFoundForm(prev => ({ ...prev, questions: newQs }));
                          }}
                          placeholder={`Question ${idx + 1}`}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                        />
                        <input
                          type="text"
                          required
                          value={q.answer}
                          onChange={(e) => {
                            const newQs = [...foundForm.questions];
                            newQs[idx].answer = e.target.value;
                            setFoundForm(prev => ({ ...prev, questions: newQs }));
                          }}
                          placeholder={`Answer Key ${idx + 1}`}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="mt-3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/15 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    Submit Found Item Report
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==========================================
              TAB: ACTIVE MATCHES
              ========================================== */}
          {activeTab === 'active-matches' && (
            <div className="flex flex-col gap-6">

              <div className="mb-4">
                <h3 className="font-display font-bold text-lg text-slate-100">Intelligent Matching outcomes</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The matching engine runs similarity calculations comparing categories, campus coordinates, timestamps, fingerprints, and keywords.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl text-center md:col-span-2 text-slate-400 text-xs">
                    No active matches detected currently in the system database.
                  </div>
                ) : (
                  matches.map((match) => {
                    const isMyLost = match.lostItem.ownerId === currentUser.id;
                    const isMyFound = match.foundItem.finderId === currentUser.id;
                    const approvedClaim = match.claims?.find(c => c.status === 'APPROVED');
                    const myClaim = match.claims?.find(c => c.claimantId === currentUser.id);

                    return (
                      <div
                        key={match.id}
                        className={`bg-slate-900/40 border p-6 rounded-2xl flex flex-col justify-between transition-all ${match.status === 'RESOLVED'
                            ? 'border-emerald-500/20 bg-emerald-950/5'
                            : 'border-slate-800 hover:border-indigo-500/40'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${match.status === 'RESOLVED'
                                ? 'bg-emerald-600/20 text-emerald-400'
                                : 'bg-rose-600/20 text-rose-400'
                              }`}>
                              {match.status === 'RESOLVED' ? 'Resolved & Returned' : 'Pending Claim'}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-1.5">
                              {isMyLost && <span className="text-indigo-400 font-semibold">You reported the Lost Item</span>}
                              {isMyFound && <span className="text-emerald-400 font-semibold">You reported the Found Item</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Match score:</span>
                            <span className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-display font-black text-xs text-indigo-400">
                              {match.score}%
                            </span>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-800 mb-6 bg-slate-950/20 rounded-xl p-3">
                          <div>
                            <span className="text-[8px] uppercase text-slate-400 block font-semibold">Lost Report</span>
                            <h4 className="font-bold text-xs mt-0.5 text-rose-400 truncate">{match.lostItem.title}</h4>
                            <span className="text-[9px] text-slate-400 mt-1 block">📍 {match.lostItem.locationLost}</span>
                          </div>
                          <div className="border-l border-slate-800 pl-4">
                            <span className="text-[8px] uppercase text-slate-400 block font-semibold">Found Report</span>
                            <h4 className="font-bold text-xs mt-0.5 text-emerald-400 truncate">{match.foundItem.title}</h4>
                            <span className="text-[9px] text-slate-400 mt-1 block">📍 {match.foundItem.locationFound}</span>
                          </div>
                        </div>

                        {/* Claim actions */}
                        <div className="mt-auto">
                          {match.status === 'RESOLVED' ? (
                            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              ✓ Claim Approved & Item Handed Over
                              {approvedClaim && <span className="text-[9px] text-slate-500">({approvedClaim.verificationScore}% score)</span>}
                            </div>
                          ) : isMyLost ? (
                            isPendingVerification ? (
                              <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed">
                                Verification Required to Claim
                              </button>
                            ) : myClaim ? (
                              <div className="text-xs font-semibold text-amber-500">
                                ⏳ Claim pending approval (Verification Score: {myClaim.verificationScore}%)
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setQuizAnswers({});
                                  setQuizSubmitted(false);
                                  setQuizResultScore(null);
                                  setQuizStatus(null);
                                }}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                View & Claim Now
                              </button>
                            )
                          ) : (
                            <div className="text-xs text-slate-500 italic">
                              Awaiting claim by lost item owner ({match.lostItem.owner?.name || 'Loading...'})
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: PROFILE VIEW
              ========================================== */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Profile Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {currentUser.photo ? (
                    <img
                      src={currentUser.photo}
                      alt={currentUser.name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/40 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xl">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${getTrustTier(currentUser.trustScore).color}`}>
                    {getTrustTier(currentUser.trustScore).name}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-lg text-slate-100">{currentUser.name}</h3>
                <span className="text-xs text-indigo-400 font-mono mt-0.5">{currentUser.studentId}</span>

                {currentUser.course && (
                  <p className="text-xs text-slate-400 mt-2 font-semibold">Course: {currentUser.course}</p>
                )}
                {currentUser.sex && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Sex: {currentUser.sex}</p>
                )}

                <div className="w-full mt-6 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Losts</span>
                    <strong className="text-sm text-slate-200 mt-0.5 block">{currentUser._count?.lostItems ?? 0}</strong>
                  </div>
                  <div className="border-l border-r border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Founds</span>
                    <strong className="text-sm text-slate-200 mt-0.5 block">{currentUser._count?.foundItems ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">Claims</span>
                    <strong className="text-sm text-slate-200 mt-0.5 block">{currentUser._count?.claims ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Trust Point Logs */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col">
                <div className="mb-4">
                  <h3 className="font-display font-semibold text-slate-100">Trust Log History</h3>
                  <p className="text-xs text-slate-400 mt-1">Audit trail of account points updates.</p>
                </div>

                <div className="flex-grow overflow-y-auto max-h-[300px] flex flex-col gap-3 pr-1">
                  {!currentUser.trustLogs || currentUser.trustLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No logs recorded currently.</p>
                  ) : (
                    currentUser.trustLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-200 font-semibold">{log.reason}</p>
                          <span className="text-[9px] text-slate-500 block mt-1">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${log.scoreChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {log.scoreChange >= 0 ? `+${log.scoreChange}` : log.scoreChange}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: ADMIN PANEL
              ========================================== */}
          {activeTab === 'admin-panel' && currentUser.role === 'ADMIN' && (
            <div className="flex flex-col gap-8">

              {/* User Verification Queue */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
                <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider mb-4">
                  👥 User Registration Verification Queue
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="pb-3">Photo</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">ID / Username</th>
                        <th className="pb-3">Course</th>
                        <th className="pb-3">Sex</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsersList.filter(u => u.studentId !== 'Kyle').length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 italic">No registered users to manage.</td>
                        </tr>
                      ) : (
                        adminUsersList.filter(u => u.studentId !== 'Kyle').map((u) => (
                          <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-900/10">
                            <td className="py-3">
                              <img
                                src={u.photo || 'https://via.placeholder.com/150'}
                                alt={u.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-800"
                              />
                            </td>
                            <td className="py-3 font-semibold text-slate-200">{u.name}</td>
                            <td className="py-3 font-mono">{u.studentId}</td>
                            <td className="py-3 text-slate-300">{u.course || 'N/A'}</td>
                            <td className="py-3 text-slate-300">{u.sex || 'N/A'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${u.isVerified ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400 animate-pulse'
                                }`}>
                                {u.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                {!u.isVerified && (
                                  <button
                                    onClick={() => handleVerifyUser(u.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDenyUser(u.id)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  {u.isVerified ? 'Delete User' : 'Deny (Delete)'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items & Claims Supervision */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Reports lists */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
                  <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider mb-4">
                    📦 Active Lost/Found Reports
                  </h3>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 text-xs">
                    {/* Lost */}
                    {adminLostList.map(item => (
                      <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] px-1 bg-rose-500/10 text-rose-400 rounded font-bold uppercase">Lost</span>
                            <h4 className="font-bold text-slate-200">{item.title}</h4>
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-1">Owner ID: {item.ownerId}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem('lost', item.id)}
                          className="px-2.5 py-1 hover:bg-rose-600/10 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}

                    {/* Found */}
                    {adminFoundList.map(item => (
                      <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-400 rounded font-bold uppercase">Found</span>
                            <h4 className="font-bold text-slate-200">{item.title}</h4>
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-1">Finder ID: {item.finderId}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem('found', item.id)}
                          className="px-2.5 py-1 hover:bg-rose-600/10 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}

                    {adminLostList.length === 0 && adminFoundList.length === 0 && (
                      <p className="text-slate-500 italic text-center py-4">No reported items currently in database.</p>
                    )}
                  </div>
                </div>

                {/* Claims list */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
                  <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider mb-4">
                    🛡 Claims Ledger
                  </h3>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 text-xs">
                    {adminClaimsList.length === 0 ? (
                      <p className="text-slate-500 italic text-center py-4">No claims listed in database.</p>
                    ) : (
                      adminClaimsList.map(claim => (
                        <div key={claim.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-200">Claim on match: {claim.matchId}</h4>
                              <span className={`text-[8px] px-1.5 rounded font-bold uppercase ${claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>{claim.status}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-1">Claimant: {claim.claimant?.name || claim.claimantId} (Score: {claim.verificationScore}%)</span>
                          </div>
                          <button
                            onClick={() => handleDeleteClaim(claim.id)}
                            className="px-2.5 py-1 hover:bg-rose-600/10 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* ==========================================
          DYNAMIC OVERLAYS: VERIFICATION MODAL QUIZ
          ========================================== */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
              <div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  Ownership Verification
                </span>
                <h3 className="font-display font-bold text-sm text-slate-100 mt-1.5">
                  Verify Ownership: {selectedMatch.lostItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">

              <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-600/5 flex items-center gap-4 text-xs">
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="2.5" fill="none" />
                    <circle
                      cx="24" cy="24" r="20"
                      className="stroke-indigo-500"
                      strokeWidth="2.5" fill="none"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * (1 - selectedMatch.score / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-display font-black text-[10px] text-indigo-400">
                    {selectedMatch.score}%
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200">Matching Engine Score breakdown</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Calculated automatically from categories, date/time, and keywords characteristics.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-slate-200 text-[10px] uppercase tracking-wider">
                  Answer Finder's secret verification questions:
                </h4>

                {selectedMatch.foundItem.secretQuestions && selectedMatch.foundItem.secretQuestions.length > 0 ? (
                  selectedMatch.foundItem.secretQuestions.map((qObj, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-indigo-400">Question {qIdx + 1}: {qObj.question}</span>

                      {quizSubmitted ? (
                        <div className="flex flex-col gap-1 mt-1 text-xs">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Your Answer:</span>
                          <p className="text-slate-200 font-semibold font-mono">"{quizAnswers[qObj.question] || ''}"</p>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={quizAnswers[qObj.question] || ''}
                          onChange={(e) => setQuizAnswers(prev => ({ ...prev, [qObj.question]: e.target.value }))}
                          placeholder="Type your answer here..."
                          className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs focus:outline-none"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No questions requested. Submit to claim.</p>
                )}
              </div>

              {quizSubmitted && quizResultScore !== null && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${quizStatus === 'APPROVED' ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                  }`}>
                  <div className="text-lg">
                    {quizStatus === 'APPROVED' ? '🎉' : '❌'}
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-100">
                      {quizStatus === 'APPROVED' ? 'Verification Success! Claim Approved!' : 'Verification Failed'}
                    </h4>
                    <p className="text-slate-300 mt-1">
                      Ownership score calculated at <strong>{quizResultScore}%</strong>.
                    </p>
                    {quizStatus === 'APPROVED' ? (
                      <p className="text-[10px] text-emerald-400 mt-2">
                        ✓ Correct answers! Both users awarded <strong>+10 Trust Points</strong>. Status updated to returned.
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-400 mt-2">
                        ⚠ Incorrect answers. Inaccurate claims deduct <strong>-15 Trust Points</strong>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-all text-xs font-semibold cursor-pointer"
              >
                {quizSubmitted ? 'Close' : 'Cancel'}
              </button>

              {!quizSubmitted && (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Submit Answers & Validate
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
