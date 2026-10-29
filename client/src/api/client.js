const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  getProfile: () => request('/profile'),
  setTrack: (track) => request('/profile/track', { method: 'POST', body: JSON.stringify({ track }) }),
  checkin: () => request('/profile/checkin', { method: 'POST' }),

  getQuestions: (params) => request(`/questions?${new URLSearchParams(params)}`),
  getDomains: (track) => request(`/questions/domains?track=${track}`),
  answerQuestion: (id, selectedIndex, mode) =>
    request(`/questions/${id}/answer`, { method: 'POST', body: JSON.stringify({ selectedIndex, mode }) }),

  startExam: (track) => request(`/exam/start?track=${track}`),
  submitExam: (payload) => request('/exam/submit', { method: 'POST', body: JSON.stringify(payload) }),
  examHistory: (track) => request(`/exam/history?track=${track}`),

  getCaseStudies: (track) => request(`/case-studies?track=${track}`),
  getCaseStudy: (id) => request(`/case-studies/${id}`),
  answerCaseStudyQuestion: (caseId, questionId, selectedIndex) =>
    request(`/case-studies/${caseId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ selectedIndex }),
    }),
  completeCaseStudy: (caseId) => request(`/case-studies/${caseId}/complete`, { method: 'POST' }),

  getChallenges: (track) => request(`/challenges?track=${track}`),
  getChallenge: (id) => request(`/challenges/${id}`),
  getChallengeHint: (id) => request(`/challenges/${id}/hint`),
  getChallengeSolution: (id) => request(`/challenges/${id}/solution`),
  runChallenge: (id, code) => request(`/challenges/${id}/run`, { method: 'POST', body: JSON.stringify({ code }) }),

  getFlashcards: (track) => request(`/flashcards?track=${track}`),
  getDueFlashcards: (track) => request(`/flashcards/due?track=${track}`),
  reviewFlashcard: (id, quality) => request(`/flashcards/${id}/review`, { method: 'POST', body: JSON.stringify({ quality }) }),

  getSkillTree: (track) => request(`/skill-tree?track=${track}`),
};
