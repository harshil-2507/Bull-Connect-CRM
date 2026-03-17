--
-- PostgreSQL database dump
--

\restrict yQq2rHGR3b7yNzNPolHP8aW6CSo2XjU2JCvgVNo7BkgfUKCPmGRVa92aGi7dW3b

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'ASSIGN',
    'STATUS_CHANGE'
);


ALTER TYPE public.audit_action OWNER TO postgres;

--
-- Name: call_disposition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.call_disposition AS ENUM (
    'INTERESTED',
    'CALLBACK',
    'BUSY',
    'NOT_INTERESTED',
    'NO_ANSWER',
    'INVALID_NUMBER'
);


ALTER TYPE public.call_disposition OWNER TO postgres;

--
-- Name: campaign_status; Type: TYPE; Schema: public; Owner: harshilandhariya
--

CREATE TYPE public.campaign_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED'
);


ALTER TYPE public.campaign_status OWNER TO harshilandhariya;

--
-- Name: drop_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.drop_reason AS ENUM (
    'NOT_INTERESTED',
    'INVALID_NUMBER',
    'DUPLICATE',
    'OUT_OF_AREA',
    'NOT_QUALIFIED',
    'OTHER'
);


ALTER TYPE public.drop_reason OWNER TO postgres;

--
-- Name: entity_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entity_type AS ENUM (
    'USER',
    'CAMPAIGN',
    'LEAD',
    'ASSIGNMENT',
    'CALL_LOG'
);


ALTER TYPE public.entity_type OWNER TO postgres;

--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_status AS ENUM (
    'NEW',
    'ASSIGNED',
    'CONTACTED',
    'FIELD_REQUESTED',
    'DROPPED',
    'VISIT_REQUESTED',
    'VISIT_ASSIGNED',
    'VISIT_COMPLETED',
    'SOLD'
);


ALTER TYPE public.lead_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'MANAGER',
    'TELECALLER',
    'FIELD_MANAGER',
    'FIELD_EXEC'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: visit_outcome; Type: TYPE; Schema: public; Owner: harshilandhariya
--

CREATE TYPE public.visit_outcome AS ENUM (
    'SOLD',
    'INTERESTED',
    'NOT_INTERESTED'
);


ALTER TYPE public.visit_outcome OWNER TO harshilandhariya;

--
-- Name: visit_status; Type: TYPE; Schema: public; Owner: harshilandhariya
--

CREATE TYPE public.visit_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.visit_status OWNER TO harshilandhariya;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: validate_lead_status_transition(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_lead_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    -- Allow initial creation
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'NEW' THEN
            RAISE EXCEPTION 'New leads must have status NEW';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.status != NEW.status THEN

        CASE OLD.status

            WHEN 'NEW' THEN
                IF NEW.status NOT IN ('ASSIGNED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: NEW → %', NEW.status;
                END IF;

            WHEN 'ASSIGNED' THEN
                IF NEW.status NOT IN ('CONTACTED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: ASSIGNED → %', NEW.status;
                END IF;

            WHEN 'CONTACTED' THEN
                IF NEW.status NOT IN ('VISIT_REQUESTED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: CONTACTED → %', NEW.status;
                END IF;

            WHEN 'VISIT_REQUESTED' THEN
                IF NEW.status NOT IN ('VISIT_ASSIGNED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: VISIT_REQUESTED → %', NEW.status;
                END IF;

            WHEN 'VISIT_ASSIGNED' THEN
                IF NEW.status NOT IN ('VISIT_COMPLETED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: VISIT_ASSIGNED → %', NEW.status;
                END IF;

            WHEN 'VISIT_COMPLETED' THEN
                IF NEW.status NOT IN ('SOLD', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: VISIT_COMPLETED → %', NEW.status;
                END IF;

            WHEN 'SOLD' THEN
                RAISE EXCEPTION 'Invalid transition: SOLD is terminal';

            WHEN 'DROPPED' THEN
                RAISE EXCEPTION 'Invalid transition: DROPPED is terminal';

            ELSE
                RAISE EXCEPTION 'Unknown status: %', OLD.status;

        END CASE;

    END IF;

    RETURN NEW;

END;
$$;


ALTER FUNCTION public.validate_lead_status_transition() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: TABLE assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.assignments IS 'Historical record of all lead assignments';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id uuid,
    entity_type public.entity_type NOT NULL,
    entity_id uuid NOT NULL,
    action public.audit_action NOT NULL,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for compliance and debugging';


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: call_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.call_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    disposition public.call_disposition NOT NULL,
    notes text,
    next_callback_at timestamp without time zone,
    duration_seconds integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT call_logs_duration_seconds_check CHECK (((duration_seconds IS NULL) OR (duration_seconds >= 0)))
);


ALTER TABLE public.call_logs OWNER TO postgres;

--
-- Name: TABLE call_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.call_logs IS 'Complete audit trail of all call attempts';


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public.campaign_status DEFAULT 'ACTIVE'::public.campaign_status,
    region text,
    CONSTRAINT campaigns_check CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT campaigns_name_check CHECK ((char_length((name)::text) >= 3))
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: TABLE campaigns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.campaigns IS 'Marketing campaigns for lead grouping and tracking';


--
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    crop_type text,
    estimated_quantity numeric,
    expected_value numeric,
    status text NOT NULL,
    telecaller_id uuid,
    field_exec_id uuid,
    closed_reason text,
    closed_at timestamp without time zone,
    created_by uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.deals OWNER TO postgres;

--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: harshilandhariya
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    activity_type text NOT NULL,
    description text NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_activities OWNER TO harshilandhariya;

--
-- Name: lead_events; Type: TABLE; Schema: public; Owner: harshilandhariya
--

CREATE TABLE public.lead_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    old_status public.lead_status,
    new_status public.lead_status NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_events OWNER TO harshilandhariya;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farmer_name character varying(255),
    phone_number character varying(15) NOT NULL,
    village character varying(255),
    taluka character varying(255),
    district character varying(255),
    state character varying(100),
    campaign_id uuid,
    status public.lead_status DEFAULT 'NEW'::public.lead_status NOT NULL,
    assigned_to uuid,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_contacted_at timestamp without time zone,
    next_callback_at timestamp without time zone,
    drop_reason public.drop_reason,
    drop_notes text,
    crop_type character varying(100),
    acreage numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_land_bigha numeric,
    interested_in_warehouse boolean,
    previous_experience boolean,
    farmer_type character varying(100),
    bull_centre character varying(255),
    farmer_id character varying(100),
    alternate_phone character varying(15),
    source character varying(100),
    product_type character varying(100),
    sold_before_bull boolean,
    sold_after_bull boolean,
    experience_or_remarks text,
    castor_bori integer,
    castor_expected_price numeric,
    castor_offered_price numeric,
    castor_expected_harvest_time date,
    castor_vavetar_bigha numeric,
    castor_deal_status character varying(50),
    castor_intent_to_sell character varying(50),
    groundnut_bori integer,
    groundnut_expected_price numeric,
    groundnut_offered_price numeric,
    groundnut_expected_harvest_time date,
    groundnut_vavetar_bigha numeric,
    groundnut_intent_to_sell character varying(50),
    geo_state text,
    CONSTRAINT leads_acreage_check CHECK (((acreage IS NULL) OR (acreage > (0)::numeric))),
    CONSTRAINT leads_attempt_count_check CHECK ((attempt_count >= 0)),
    CONSTRAINT leads_check CHECK ((((status = 'DROPPED'::public.lead_status) AND (drop_reason IS NOT NULL)) OR ((status <> 'DROPPED'::public.lead_status) AND (drop_reason IS NULL)))),
    CONSTRAINT leads_check1 CHECK ((((status = 'FIELD_REQUESTED'::public.lead_status) AND (crop_type IS NOT NULL) AND (acreage IS NOT NULL)) OR (status <> 'FIELD_REQUESTED'::public.lead_status))),
    CONSTRAINT leads_phone_number_check CHECK (((phone_number)::text ~ '^[0-9]{10,15}$'::text))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: TABLE leads; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leads IS 'Core lead entity with strict state machine enforcement';


--
-- Name: COLUMN leads.phone_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads.phone_number IS 'Unique indexed field for fast lookups';


--
-- Name: COLUMN leads.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads.status IS 'Enforced by trigger: NEW → ASSIGNED → CONTACTED → (FIELD_REQUESTED | DROPPED)';


--
-- Name: COLUMN leads.attempt_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads.attempt_count IS 'Incremented automatically on each call log entry';


--
-- Name: points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    points integer NOT NULL,
    reason character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT points_points_check CHECK ((points <> 0))
);


ALTER TABLE public.points OWNER TO postgres;

--
-- Name: TABLE points; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.points IS 'Gamification and performance tracking system';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    phone character varying(15),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_name_check CHECK ((char_length((name)::text) >= 2)),
    CONSTRAINT users_username_check CHECK ((char_length((username)::text) >= 3))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Internal employees with authentication and role-based access';


--
-- Name: v_leads_by_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_leads_by_status AS
 SELECT l.status,
    l.campaign_id,
    c.name AS campaign_name,
    count(*) AS lead_count,
    count(DISTINCT l.assigned_to) AS unique_assignees
   FROM (public.leads l
     JOIN public.campaigns c ON ((l.campaign_id = c.id)))
  GROUP BY l.status, l.campaign_id, c.name;


ALTER TABLE public.v_leads_by_status OWNER TO postgres;

--
-- Name: v_telecaller_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_telecaller_stats AS
 SELECT u.id AS user_id,
    u.name AS telecaller_name,
    count(DISTINCT cl.lead_id) AS leads_contacted,
    count(*) AS total_calls,
    count(*) FILTER (WHERE (cl.disposition = 'INTERESTED'::public.call_disposition)) AS interested_count,
    count(*) FILTER (WHERE (cl.disposition = 'NOT_INTERESTED'::public.call_disposition)) AS not_interested_count,
    round(avg(cl.duration_seconds)) AS avg_call_duration
   FROM (public.users u
     LEFT JOIN public.call_logs cl ON ((u.id = cl.user_id)))
  WHERE (u.role = 'TELECALLER'::public.user_role)
  GROUP BY u.id, u.name;


ALTER TABLE public.v_telecaller_stats OWNER TO postgres;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    field_exec_id uuid,
    status text NOT NULL,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    visit_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    outcome text
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: call_logs call_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: harshilandhariya
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_events lead_events_pkey; Type: CONSTRAINT; Schema: public; Owner: harshilandhariya
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_pkey PRIMARY KEY (id);


--
-- Name: leads leads_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_phone_number_key UNIQUE (phone_number);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: points points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points
    ADD CONSTRAINT points_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_assignments_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_is_active ON public.assignments USING btree (is_active);


--
-- Name: idx_assignments_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_lead_id ON public.assignments USING btree (lead_id);


--
-- Name: idx_assignments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_user_id ON public.assignments USING btree (user_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_metadata; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_call_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_call_logs_created_at ON public.call_logs USING btree (created_at);


--
-- Name: idx_call_logs_disposition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_call_logs_disposition ON public.call_logs USING btree (disposition);


--
-- Name: idx_call_logs_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_call_logs_lead_id ON public.call_logs USING btree (lead_id);


--
-- Name: idx_call_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_call_logs_user_id ON public.call_logs USING btree (user_id);


--
-- Name: idx_campaigns_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_created_at ON public.campaigns USING btree (created_at);


--
-- Name: idx_campaigns_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_created_by ON public.campaigns USING btree (created_by);


--
-- Name: idx_campaigns_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_dates ON public.campaigns USING btree (start_date, end_date);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);


--
-- Name: idx_deals_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_created_at ON public.deals USING btree (created_at);


--
-- Name: idx_deals_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_lead_id ON public.deals USING btree (lead_id);


--
-- Name: idx_deals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_status ON public.deals USING btree (status);


--
-- Name: idx_leads_assigned_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_assigned_status ON public.leads USING btree (assigned_to, status);


--
-- Name: idx_leads_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);


--
-- Name: idx_leads_campaign_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_campaign_id ON public.leads USING btree (campaign_id);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at);


--
-- Name: idx_leads_next_callback; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_next_callback ON public.leads USING btree (next_callback_at) WHERE (next_callback_at IS NOT NULL);


--
-- Name: idx_leads_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_phone_number ON public.leads USING btree (phone_number);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_leads_status_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status_assigned ON public.leads USING btree (status, assigned_to);


--
-- Name: idx_leads_status_campaign; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status_campaign ON public.leads USING btree (status, campaign_id);


--
-- Name: idx_points_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_created_at ON public.points USING btree (created_at);


--
-- Name: idx_points_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_user_id ON public.points USING btree (user_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_visits_field_exec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_field_exec ON public.visits USING btree (field_exec_id);


--
-- Name: idx_visits_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_lead_id ON public.visits USING btree (lead_id);


--
-- Name: idx_visits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_status ON public.visits USING btree (status);


--
-- Name: leads enforce_lead_status_transitions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_lead_status_transitions BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.validate_lead_status_transition();


--
-- Name: campaigns update_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignments assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: assignments assignments_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: call_logs call_logs_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: call_logs call_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: campaigns campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: deals deals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deals deals_field_exec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_field_exec_id_fkey FOREIGN KEY (field_exec_id) REFERENCES public.users(id);


--
-- Name: deals deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: deals deals_telecaller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_telecaller_id_fkey FOREIGN KEY (telecaller_id) REFERENCES public.users(id);


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: harshilandhariya
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_events lead_events_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: harshilandhariya
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: lead_events lead_events_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: harshilandhariya
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE RESTRICT;


--
-- Name: points points_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points
    ADD CONSTRAINT points_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: points points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points
    ADD CONSTRAINT points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: visits visits_field_exec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_field_exec_id_fkey FOREIGN KEY (field_exec_id) REFERENCES public.users(id);


--
-- Name: visits visits_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yQq2rHGR3b7yNzNPolHP8aW6CSo2XjU2JCvgVNo7BkgfUKCPmGRVa92aGi7dW3b

