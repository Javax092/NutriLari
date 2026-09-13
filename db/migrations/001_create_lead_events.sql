CREATE TABLE IF NOT EXISTS lead_events (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  eventType TEXT NOT NULL CHECK (eventType IN ('PAGE_VIEW', 'DIAGNOSTIC_STARTED', 'DIAGNOSTIC_COMPLETED', 'WHATSAPP_CLICK')),
  source TEXT,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  landingPage TEXT,
  currentPage TEXT,
  referrer TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_events_createdAt ON lead_events(createdAt);
CREATE INDEX IF NOT EXISTS idx_lead_events_sessionId ON lead_events(sessionId);
CREATE INDEX IF NOT EXISTS idx_lead_events_eventType ON lead_events(eventType);
CREATE INDEX IF NOT EXISTS idx_lead_events_source ON lead_events(source);
CREATE INDEX IF NOT EXISTS idx_lead_events_campaign ON lead_events(campaign);
