
CREATE TYPE public.incident_status AS ENUM ('draft','submitted','archived');
CREATE TYPE public.incident_input_mode AS ENUM ('text','voice');
CREATE TYPE public.evidence_kind AS ENUM ('photo','video','audio','document');
CREATE TYPE public.sos_status AS ENUM ('active','resolved','cancelled');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  address TEXT,
  blood_group TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  notify_on_sos BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_own" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX emergency_contacts_user_idx ON public.emergency_contacts(user_id);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled incident',
  incident_type TEXT NOT NULL DEFAULT 'harassment',
  description TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ,
  location TEXT,
  suspect_details TEXT,
  input_mode public.incident_input_mode NOT NULL DEFAULT 'text',
  status public.incident_status NOT NULL DEFAULT 'draft',
  ai_report TEXT,
  ai_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_own" ON public.incidents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX incidents_user_idx ON public.incidents(user_id, created_at DESC);
CREATE TRIGGER incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- evidence
CREATE TABLE public.incident_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind public.evidence_kind NOT NULL DEFAULT 'photo',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_evidence TO authenticated;
GRANT ALL ON public.incident_evidence TO service_role;
ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_own" ON public.incident_evidence FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX evidence_incident_idx ON public.incident_evidence(incident_id);

-- sos alerts
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_label TEXT,
  message TEXT,
  status public.sos_status NOT NULL DEFAULT 'active',
  contacts_notified INTEGER NOT NULL DEFAULT 0,
  notification_error TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_own" ON public.sos_alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sos_user_idx ON public.sos_alerts(user_id, created_at DESC);
CREATE TRIGGER sos_updated_at BEFORE UPDATE ON public.sos_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'update',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- public reference data
CREATE TABLE public.safety_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'shield',
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.safety_tips TO anon, authenticated;
GRANT ALL ON public.safety_tips TO service_role;
ALTER TABLE public.safety_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips_public_read" ON public.safety_tips FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.nearby_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  open_24x7 BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.nearby_services TO anon, authenticated;
GRANT ALL ON public.nearby_services TO service_role;
ALTER TABLE public.nearby_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_public_read" ON public.nearby_services FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.safety_tips (title, body, icon, sort_order) VALUES
('Share your live location','Before travelling alone at night, share your live location with at least one trusted contact.','map-pin',1),
('Keep SOS one tap away','Add SafeHer to your home screen so the emergency button is always reachable.','shield',2),
('Record early, report later','If you feel unsafe, start recording audio or video first. You can build the report calmly afterwards.','mic',3),
('Note vehicle numbers','A quick photo of a number plate is often the single most useful piece of evidence.','camera',4),
('Stay in lit, busy areas','Prefer main roads with shops and street lighting over shortcuts through quiet lanes.','lamp',5),
('Trust your instinct','If a situation feels wrong, leave it. You never need a reason to walk away.','heart',6);

INSERT INTO public.nearby_services (name, category, phone, address, city, open_24x7, sort_order) VALUES
('National Emergency Number','helpline','112','Nationwide emergency response',NULL,true,1),
('Women Helpline','helpline','1091','24x7 women in distress helpline',NULL,true,2),
('Domestic Abuse Helpline','helpline','181','Women helpline for domestic abuse support',NULL,true,3),
('Cyber Crime Helpline','helpline','1930','Report online harassment and financial fraud',NULL,true,4),
('City Police Control Room','police','100','Central Police Control Room','Your city',true,5),
('District Government Hospital','hospital','102','Emergency and trauma care','Your city',true,6),
('Sakhi One Stop Centre','shelter','181','Shelter, counselling and legal aid for women','Your city',true,7),
('Ambulance Service','hospital','108','Free emergency ambulance service',NULL,true,8);
