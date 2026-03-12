--
-- PostgreSQL database dump
--

\restrict HQLGbxaoSVkQKTrdy6U264GR1qIhYImAml7G3auoZddbUoOfGxovM35bW90nasf

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
-- Name: deal_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.deal_status AS ENUM (
    'NEW',
    'CONTACTED',
    'VISIT_REQUESTED',
    'VISIT_ASSIGNED',
    'VISIT_COMPLETED',
    'NEGOTIATION',
    'SOLD',
    'LOST',
    'DORMANT'
);


ALTER TYPE public.deal_status OWNER TO postgres;

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
    'VISIT_REQUESTED',
    'VISIT_ASSIGNED',
    'VISIT_COMPLETED',
    'SOLD',
    'DROPPED'
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
-- Name: visit_outcome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_outcome AS ENUM (
    'SOLD',
    'WAITING',
    'DROPPED',
    'QUALITY_REJECTED'
);


ALTER TYPE public.visit_outcome OWNER TO postgres;

--
-- Name: visit_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_request_status AS ENUM (
    'PENDING',
    'ASSIGNED',
    'CANCELLED'
);


ALTER TYPE public.visit_request_status OWNER TO postgres;

--
-- Name: visit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.visit_status OWNER TO postgres;

--
-- Name: log_lead_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_lead_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id UUID;
    v_source TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN

        -- Safely read session variables
        BEGIN
            v_user_id := current_setting('app.user_id', true)::UUID;
        EXCEPTION WHEN others THEN
            v_user_id := NULL;
        END;

        BEGIN
            v_source := current_setting('app.source', true);
        EXCEPTION WHEN others THEN
            v_source := 'SYSTEM';
        END;

        INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            changed_by,
            source,
            metadata
        )
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            v_user_id,
            COALESCE(v_source, 'SYSTEM'),
            NULL
        );

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_lead_status_change() OWNER TO postgres;

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
                IF NEW.status NOT IN ('ASSIGNED') THEN
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
                IF NEW.status NOT IN ('VISIT_COMPLETED') THEN
                    RAISE EXCEPTION 'Invalid transition: VISIT_ASSIGNED → %', NEW.status;
                END IF;

            WHEN 'VISIT_COMPLETED' THEN
                IF NEW.status NOT IN ('SOLD', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: VISIT_COMPLETED → %', NEW.status;
                END IF;

            WHEN 'SOLD' THEN
                RAISE EXCEPTION 'SOLD is terminal state';

            WHEN 'DROPPED' THEN
                RAISE EXCEPTION 'DROPPED is terminal state';

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
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

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
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    status public.deal_status DEFAULT 'NEW'::public.deal_status NOT NULL,
    created_by uuid,
    assigned_to uuid,
    closed_reason text,
    closed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.deals OWNER TO postgres;

--
-- Name: lead_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_status_history (
    id bigint NOT NULL,
    lead_id uuid NOT NULL,
    old_status public.lead_status NOT NULL,
    new_status public.lead_status NOT NULL,
    changed_by uuid,
    source character varying(50) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lead_status_history OWNER TO postgres;

--
-- Name: lead_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lead_status_history_id_seq OWNER TO postgres;

--
-- Name: lead_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_status_history_id_seq OWNED BY public.lead_status_history.id;


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
    status public.lead_status DEFAULT 'NEW'::public.lead_status NOT NULL,
    farmer_type text,
    bull_centre text,
    total_land_bigha double precision,
    interested_in_warehouse boolean,
    previous_experience text,
    CONSTRAINT leads_acreage_check CHECK (((acreage IS NULL) OR (acreage > (0)::numeric))),
    CONSTRAINT leads_attempt_count_check CHECK ((attempt_count >= 0)),
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
    count(*) AS lead_count
   FROM public.leads l
  GROUP BY l.status, l.campaign_id;


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
-- Name: visit_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visit_id uuid NOT NULL,
    photo_url text NOT NULL,
    photo_type character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.visit_photos OWNER TO postgres;

--
-- Name: visit_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    priority integer DEFAULT 1,
    notes text,
    status public.visit_request_status DEFAULT 'PENDING'::public.visit_request_status NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.visit_requests OWNER TO postgres;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visit_request_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    field_exec_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    scheduled_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    start_lat numeric(10,7),
    start_lng numeric(10,7),
    end_lat numeric(10,7),
    end_lng numeric(10,7),
    status public.visit_status DEFAULT 'SCHEDULED'::public.visit_status NOT NULL,
    outcome public.visit_outcome,
    outcome_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT visits_check CHECK ((((status = 'COMPLETED'::public.visit_status) AND (outcome IS NOT NULL)) OR (status <> 'COMPLETED'::public.visit_status)))
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: lead_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history ALTER COLUMN id SET DEFAULT nextval('public.lead_status_history_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, lead_id, user_id, type, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, lead_id, user_id, assigned_by, assigned_at, is_active) FROM stdin;
8b221bab-dd3d-475b-a758-351be7754f38	1eafc6c6-5af9-4b03-82c0-17503007149a	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	0c2636a2-63cb-4c52-a559-fc621ba69aad	2026-03-01 12:46:06.743439	t
9cdcd4c1-b79b-42a2-952d-008594410658	2408cace-27a2-497b-95b2-51d3f1e379d0	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	3670724e-802e-41b1-baf7-1c4d2f6aaadf	2026-03-03 21:20:32.373272	t
6d2e2781-1fab-4da2-a9cd-ba604af19cab	675904cb-2e3f-4f18-994f-4bc1d061c9ed	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	3670724e-802e-41b1-baf7-1c4d2f6aaadf	2026-03-03 22:56:18.11767	t
fadb885d-873e-4ae1-9386-412906a387f5	675904cb-2e3f-4f18-994f-4bc1d061c9ed	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	3670724e-802e-41b1-baf7-1c4d2f6aaadf	2026-03-03 22:56:20.435575	t
a1324269-3a34-4833-b409-41b0d8aec6fb	fc5a4620-4644-4aa4-a559-dfbe20334c97	8922127a-452d-4b67-ac08-35dbd00a854c	3670724e-802e-41b1-baf7-1c4d2f6aaadf	2026-03-04 00:03:55.733676	t
ebae6c42-7d98-4369-bfe4-a805e065cc7d	675904cb-2e3f-4f18-994f-4bc1d061c9ed	94fd2aca-2ce5-4614-ab03-d1885a22caba	01bcfba6-36de-4472-a0e2-11b57d3ae679	2026-03-04 00:41:59.985454	t
93e51bbc-9d62-4d39-9c5c-617f358a4cd3	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	bef5136d-306e-4c89-9bf2-39f8c8101e64	3670724e-802e-41b1-baf7-1c4d2f6aaadf	2026-03-04 02:04:12.369146	t
ca98d899-26f7-4826-bd30-81753f6ea981	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	94fd2aca-2ce5-4614-ab03-d1885a22caba	01bcfba6-36de-4472-a0e2-11b57d3ae679	2026-03-04 02:28:17.623582	t
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, entity_type, entity_id, action, metadata, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: call_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.call_logs (id, lead_id, user_id, disposition, notes, next_callback_at, duration_seconds, created_at) FROM stdin;
f376b991-c226-444d-a067-dd8d375c14cb	1eafc6c6-5af9-4b03-82c0-17503007149a	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	INTERESTED	Farmer interested in product demo	\N	\N	2026-03-01 12:58:52.475972
e8bbb34c-5dd2-45c5-8c74-9434997bcb44	2408cace-27a2-497b-95b2-51d3f1e379d0	bef5136d-306e-4c89-9bf2-39f8c8101e64	INTERESTED	Farmer interested	\N	\N	2026-03-03 21:44:33.191601
6bbaa075-6613-4ce2-a465-88c14cff5a5e	675904cb-2e3f-4f18-994f-4bc1d061c9ed	bef5136d-306e-4c89-9bf2-39f8c8101e64	INTERESTED	Farmer ready for site visit	\N	\N	2026-03-03 23:06:17.412945
f3f7b96b-6826-4ad0-bf32-b166d12501f8	fc5a4620-4644-4aa4-a559-dfbe20334c97	8922127a-452d-4b67-ac08-35dbd00a854c	INTERESTED	Farmer ready for field visit	\N	\N	2026-03-04 00:18:40.022062
b03565db-5c07-4a18-8e9f-816e82b8eefa	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	bef5136d-306e-4c89-9bf2-39f8c8101e64	INTERESTED	Farmer needs 50 bags of fertilizer. Requested field verification.	\N	\N	2026-03-04 02:08:09.215657
86308846-e4cd-45f7-8c48-f99696eae2d5	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	bef5136d-306e-4c89-9bf2-39f8c8101e64	INTERESTED	Farmer needs 50 bags of fertilizer. Requested field verification.	\N	\N	2026-03-04 02:22:55.342844
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, name, description, start_date, end_date, is_active, created_by, created_at, updated_at) FROM stdin;
1b4c1703-20af-41c3-881b-e1acaf49d540	Test Campaign	Testing	2026-02-22	2026-03-24	t	ae390c91-2f8c-4745-beba-74768edcf05c	2026-02-22 23:58:48.040495	2026-02-22 23:58:48.040495
8a46eba7-8673-402d-8e92-db50d976e9ff	Seed Campaign	\N	2026-03-04	\N	t	f841d63d-dfc9-48d5-8d65-aabb3a7449ae	2026-03-04 03:37:18.448937	2026-03-04 03:37:18.448937
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deals (id, lead_id, crop_type, estimated_quantity, expected_value, status, created_by, assigned_to, closed_reason, closed_at, created_at, updated_at) FROM stdin;
be09564e-af1e-4dcf-9047-ec2557c71738	675904cb-2e3f-4f18-994f-4bc1d061c9ed	\N	\N	\N	SOLD	bef5136d-306e-4c89-9bf2-39f8c8101e64	bef5136d-306e-4c89-9bf2-39f8c8101e64	\N	\N	2026-03-03 23:06:17.412945	2026-03-04 01:46:09.62516
98d7887d-912f-4398-9891-9f264aaf5dad	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	Cotton	8.5	\N	SOLD	bef5136d-306e-4c89-9bf2-39f8c8101e64	bef5136d-306e-4c89-9bf2-39f8c8101e64	\N	\N	2026-03-04 02:22:55.342844	2026-03-04 02:29:15.045288
7bfd2a96-25e9-4aa9-9e0a-e007b78a259f	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	Cotton	13.0399023553131	62824.2519243692	SOLD	94fd2aca-2ce5-4614-ab03-d1885a22caba	94fd2aca-2ce5-4614-ab03-d1885a22caba	\N	\N	2026-03-04 03:37:18.519343	2026-03-04 03:37:18.519343
258cf97b-b783-4735-a3dd-e6fcf0b90a5f	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	Cotton	12.867508587023	129569.284722527	SOLD	94fd2aca-2ce5-4614-ab03-d1885a22caba	94fd2aca-2ce5-4614-ab03-d1885a22caba	\N	\N	2026-03-04 03:39:06.504369	2026-03-04 03:39:06.504369
52f242e7-1b8b-4b64-b1e8-941171166998	2408cace-27a2-497b-95b2-51d3f1e379d0	Cotton	7.29393638893583	137269.783521198	SOLD	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
54400525-88a4-48d8-855a-7eee36f533c3	fc5a4620-4644-4aa4-a559-dfbe20334c97	Wheat	9.4388739950211	91269.1199031958	SOLD	8922127a-452d-4b67-ac08-35dbd00a854c	8922127a-452d-4b67-ac08-35dbd00a854c	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
bba6b4e7-956b-4a66-8f31-c11fc19ccade	6333de00-b21d-4bab-8ce0-19921dadc2fa	Wheat	14.8233739304111	110776.648701787	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
19f1f2cb-910f-4a2b-959f-7f5cc1f8dd8a	8463c290-4d93-4e90-9d3b-c0a798eff6a3	Wheat	6.28115064275299	52194.508594383	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
78916f7e-efed-49ef-b9bf-d59ba3fc02f8	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	Cotton	10.2399024092176	78791.1645044158	SOLD	94fd2aca-2ce5-4614-ab03-d1885a22caba	94fd2aca-2ce5-4614-ab03-d1885a22caba	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
ffa6e510-f724-46f0-827a-d940af2f2db7	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	Wheat	8.73850503767564	132116.469131175	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
1c479c80-a2bf-43ac-af7b-c799a390f545	667ca3a6-212d-4669-a4da-50224377399e	Wheat	9.58843546284371	99594.4974011646	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
f1f65d85-937a-4aef-a461-4dc05cc0e553	2f2ba06d-9233-422f-853b-20ed45f6bebe	Wheat	13.2272013739475	148957.388618709	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
76706d5b-82f2-4917-acc0-d837e8993bd6	9070b23b-8612-4242-acb4-05f0472e168b	Wheat	14.798118272528	141962.754015806	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
624811d7-5cd9-46e4-8806-866e7689345d	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	Wheat	10.1246988001902	53607.7951435136	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
4d9d7c43-80f5-4dc1-a19a-5896a8d7f6c8	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	Wheat	14.5913898985275	68544.6118530333	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
fdae96bc-8d1b-4405-8613-097cda08c427	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	Wheat	10.2293686578107	82679.4386668187	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
d074427c-661f-4f8f-9407-9630dbd2aba0	c5739442-e088-4082-8ba9-369309ce896b	Wheat	9.53276715798154	116376.587464081	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
7a13fde6-a312-4f3a-ac47-0df4622e7790	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	Wheat	9.51562273984031	54937.1398970084	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
5ada37ae-fe8a-44fe-b545-2e0ac74b13bf	96ea73d5-f80d-4a76-803f-44ae4acbbf06	Wheat	7.78549818151262	128189.9690339	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
a58088f9-e5eb-429f-9853-adf5c0c0ced7	5f209a49-159c-4798-b32d-62b9afe33eb0	Wheat	11.2992353805026	149391.322615157	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
b1897bcc-538c-49f1-bf20-f9c18d7c215f	117c1d82-6651-48ba-9ae0-8e37b3020062	Wheat	7.47227486136097	106314.15143463	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
65d2dc12-b1a5-4ca0-899b-c478d1a0f135	9b763dda-f572-46ae-b140-01d7ed0a39a0	Wheat	14.1571114850371	74678.1186824666	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
c87168c0-d4f0-4280-b76e-414bc8a4cc33	25774ac1-fd82-4f3a-b6c2-df0beceef04d	Wheat	8.07187608207627	94836.1685528052	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
d7cf87f7-884c-40cd-b76f-b84aa2661050	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	Wheat	11.5400900726862	63080.207541444	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
a8dd8f87-04bb-4a0c-a510-a68153e4c6b5	7a7bba31-0a14-44d6-b7ce-4d4626be3957	Wheat	12.1929535295726	126192.651413548	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
72c82c6a-ed3b-4c6c-87dc-04fbf206c63e	1f4e7b7e-54b8-42aa-95bc-6e4916258435	Wheat	12.4082191581918	148837.404683762	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
3dafed7e-db3e-44e5-9bdf-7f85ead3d057	8ce33615-a30a-415f-9a37-ef685af1fded	Wheat	5.67143463070138	146817.782543939	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
dc17668a-23ae-4afc-b856-7a7c6bda9e78	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	Wheat	5.24318346365469	52562.2275470429	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
0ea19ce2-a6b3-4e45-81d7-1d8807e6a380	d5e96494-d4f4-4529-8e7b-3664920dbbda	Wheat	6.21771840840694	109431.098389855	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
64490ab5-5eb8-46f5-9d86-91570411fe6c	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	Wheat	13.1963521581748	132725.523870149	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
eb8d69b8-1b5a-4a4e-9730-c3e9a1c5b1d6	56822283-8d34-4d84-9ceb-6281acf28d5b	Wheat	11.9287453720021	53916.7436757136	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
8f6eb9f0-b427-4af8-b802-0961f7c255cd	45b681df-e2b3-4a09-8ae0-16684d33b588	Wheat	10.0636301923182	55236.5279321041	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
284bc023-bbff-48a5-b1bb-6cf2d0215775	53a5203c-e09f-492a-b59b-5d50d8f1aea1	Wheat	11.6691476231364	106728.035624938	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
91e3d7a1-ca7e-47a9-bbad-738dab07dee8	af260e05-2819-44b4-8836-06e474b70647	Wheat	13.2965844531513	104848.695573383	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
720d679e-6dc3-46c4-b42b-e484a774d358	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	Wheat	10.5622957706267	92867.4831903489	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
cf8fd524-576b-4f43-9493-53eec729cf3b	b89dd81c-0b41-4c3d-aee1-28340321c151	Wheat	5.82606553833266	132028.140700061	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
755ceeae-e2a2-4eaf-afad-84b659ef5858	3df5d081-ebb8-4110-919f-f496340287b5	Wheat	9.21967063648111	52574.7581282996	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
23b90940-f204-4ea5-827d-615227da9afb	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	Wheat	6.45889805957331	118388.735351228	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
a7440df9-adab-4437-b20c-fc95c856c7df	01b11d7d-39c4-4caa-8c7b-eee772073f4f	Wheat	13.6353657261689	85048.0621380452	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
1c6a1d35-b425-4cc3-b077-7f5e111f6dec	ecf3c70a-ef04-4442-b913-f70e4dee1b17	Wheat	13.7855576616513	108002.723618032	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
43866e9e-b21f-4c60-a35a-9ffd2f71d125	563d6af6-4c01-40c8-99d3-1e65aafe27cc	Wheat	10.2976866534743	147284.908628664	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
dc16ff82-5bae-4a35-bedd-b14699c0e530	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	Wheat	9.58873200811105	103826.317988898	SOLD	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	\N	\N	2026-03-04 03:40:09.793822	2026-03-04 03:40:09.793822
\.


--
-- Data for Name: lead_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_status_history (id, lead_id, old_status, new_status, changed_by, source, metadata, created_at) FROM stdin;
1	1eafc6c6-5af9-4b03-82c0-17503007149a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-01 12:46:06.743439
4	1eafc6c6-5af9-4b03-82c0-17503007149a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-01 12:58:52.475972
5	1eafc6c6-5af9-4b03-82c0-17503007149a	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-01 12:58:52.475972
6	2408cace-27a2-497b-95b2-51d3f1e379d0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-03 21:20:32.373272
10	2408cace-27a2-497b-95b2-51d3f1e379d0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-03 21:44:33.191601
11	2408cace-27a2-497b-95b2-51d3f1e379d0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-03 21:44:33.191601
12	675904cb-2e3f-4f18-994f-4bc1d061c9ed	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-03 22:56:18.11767
13	675904cb-2e3f-4f18-994f-4bc1d061c9ed	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-03 23:06:17.412945
14	675904cb-2e3f-4f18-994f-4bc1d061c9ed	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-03 23:06:17.412945
15	fc5a4620-4644-4aa4-a559-dfbe20334c97	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 00:03:55.733676
16	fc5a4620-4644-4aa4-a559-dfbe20334c97	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 00:18:40.022062
17	fc5a4620-4644-4aa4-a559-dfbe20334c97	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 00:18:40.022062
18	675904cb-2e3f-4f18-994f-4bc1d061c9ed	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 00:41:59.985454
22	675904cb-2e3f-4f18-994f-4bc1d061c9ed	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 01:46:09.62516
23	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 02:04:12.369146
24	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 02:08:09.215657
25	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 02:08:09.215657
26	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 02:28:17.623582
27	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 02:29:15.045288
28	d7e7e52b-ec77-4494-80dd-c55ed36816f7	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
29	6333de00-b21d-4bab-8ce0-19921dadc2fa	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
30	1a032539-9a4a-4805-8b07-6ebd6aceec91	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
31	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
32	ecf3c70a-ef04-4442-b913-f70e4dee1b17	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
33	563d6af6-4c01-40c8-99d3-1e65aafe27cc	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
34	31e33e6a-99d0-4004-ac72-2265d9f5d012	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
35	a3b76924-9822-4e28-8aab-c7fb81daba01	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
36	da269c9d-031c-48c9-898a-e68d94a8d5b6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
37	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
38	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
39	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
40	8463c290-4d93-4e90-9d3b-c0a798eff6a3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
41	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
42	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
43	667ca3a6-212d-4669-a4da-50224377399e	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
44	ea2f00b2-bf51-42d0-8407-2981cd02f964	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
45	2f2ba06d-9233-422f-853b-20ed45f6bebe	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
46	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
47	9070b23b-8612-4242-acb4-05f0472e168b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
48	ed44058a-9772-481c-a9b7-eee3af0380f6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
49	30cb7537-0817-423b-8e57-132cb8514e83	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
50	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
51	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
52	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
53	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
54	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
55	c5739442-e088-4082-8ba9-369309ce896b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
56	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
57	96ea73d5-f80d-4a76-803f-44ae4acbbf06	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
58	5f209a49-159c-4798-b32d-62b9afe33eb0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
59	117c1d82-6651-48ba-9ae0-8e37b3020062	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
60	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
61	c52c9aa5-f227-4631-b43a-19ffdfd0917c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
62	9b763dda-f572-46ae-b140-01d7ed0a39a0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
63	25774ac1-fd82-4f3a-b6c2-df0beceef04d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
64	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
65	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
66	377cadec-13ac-483f-b592-f8c0c65a6913	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
67	7a7bba31-0a14-44d6-b7ce-4d4626be3957	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
68	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
69	e5491fc8-112e-41c8-96c2-091f40c56cfb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
70	1f4e7b7e-54b8-42aa-95bc-6e4916258435	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
71	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
72	8ce33615-a30a-415f-9a37-ef685af1fded	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
73	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
74	95d0cf64-841f-43a7-a738-ac2f78e5716b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
75	d5e96494-d4f4-4529-8e7b-3664920dbbda	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
76	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
77	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
78	56822283-8d34-4d84-9ceb-6281acf28d5b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
79	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
80	45b681df-e2b3-4a09-8ae0-16684d33b588	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
81	f03e7a35-00c5-496d-8388-84971fc67c2c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
82	8835717d-c031-4d9a-9af3-20f5b18720d4	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
83	53a5203c-e09f-492a-b59b-5d50d8f1aea1	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
84	b9baa47f-3a0a-4120-88e8-cba154fde4f6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
85	af260e05-2819-44b4-8836-06e474b70647	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
86	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
87	b89dd81c-0b41-4c3d-aee1-28340321c151	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
88	3df5d081-ebb8-4110-919f-f496340287b5	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
89	f80207a8-caaa-4f75-b352-eb504ae2cf31	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
90	583b01c8-510f-4196-ae00-674098ae9408	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
91	336cd48d-1851-47d6-83df-d835dc1836fb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
92	cf521eec-7a13-4e1f-af64-b4575b75dc02	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
93	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
94	01b11d7d-39c4-4caa-8c7b-eee772073f4f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
95	f08f63b0-e11c-452a-8495-3daa7a300352	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
96	f0034829-f39c-4ce2-886c-6c01c5f8e444	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
97	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
98	c977629e-3832-4007-a4b6-85d3a6078cab	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
99	531cdd4f-c162-4dcd-b835-151ca9108f67	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
100	87b5c971-d56c-4841-8d97-71727fa4ff3a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
101	db9f26d3-7f3c-4d94-ae27-b5509b898b18	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
102	0d2299a4-85c2-4879-b2a8-f660e8029ca9	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
103	0285ab05-f8a0-40bc-8afc-a62c809390a2	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
104	23a242ab-a89d-4300-9e70-65b8c90e3e15	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
105	27f7ef14-b75a-424b-bfbe-a04c5ef17b23	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
106	d5016148-0706-47bf-80b7-7ebe9cf743e8	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
107	cc91dbf5-a3f1-4e18-850a-398a4019b2f0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
108	48e66621-df13-4329-948a-866d11f8ebcb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
109	2d150789-f709-49b1-b9f7-9e9e3adf9ef9	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
110	3ffb2994-71a5-4887-a02e-f61b7478e970	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
111	3b895f2c-cb89-412c-9b92-a08e68b28c43	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
112	9fd8e422-6838-4680-892d-63685ccec416	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
113	5d7268c0-706c-4852-86f4-f63df4a9b162	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
114	5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
115	e07a60d2-437e-4a94-8858-fa79185a0cf4	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
116	fe0c0c98-b7b8-4870-9de2-3aff7306dddf	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
117	12c73d29-ff5f-4112-a842-48f1caa975a3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
118	3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
119	d19037dd-2c6f-4cb7-9054-9405ea57feda	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
120	68c21441-cf92-4da9-b6ae-10bf6067dfcd	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
121	5e7ccade-69e5-4d15-9196-651154d1c573	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
122	3b76644e-54a3-47aa-a273-83edb9a89e68	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
123	72fd3fef-00c3-490b-b091-66a346e978d3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
124	92d0e9e1-c713-460b-8c23-6ff5a58e0d90	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
125	c08ceff3-c2ff-4f70-ab1e-3b91220383cb	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
126	c485653c-c417-4422-873e-20882a65ed85	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
127	f54e22f2-ad4d-42a9-bfac-e44426d1c863	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
128	9d5092e0-8f2d-460a-b012-58f79ce3bfcc	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
129	51b59706-d48e-4dcd-b502-ff57d67f129f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
130	bf342654-c4b1-459d-89cc-86e547fb0fa0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
131	89ccb6d7-4c6d-44ce-8504-e3752b6df937	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
132	45ec03be-4edc-48a0-8c9d-d7c900968bd8	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
133	b09e8b38-9b9f-48b5-ac08-77a19b8a0420	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
134	705fa979-ccff-4768-a768-2f7868fa163b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
135	cf0d8fe7-e0a5-4fcf-8790-e991f7c67443	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
136	8e4e0ff0-c56d-4e5a-8d89-0d814d8e4cb0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
137	0f059491-617c-4030-998a-3940b7ec9d6a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
138	3f6aa06a-b2b7-4827-9f73-05e26b7d0f75	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
139	96b121fa-ca41-4d40-9ede-4f61c93a0f7a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
140	b9fce5e9-6612-4dd6-8ad4-958467abbd3c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
141	685f2a15-c3f0-4d4e-88c1-0c6ad3fe93b5	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
142	53c52bf7-5639-4a39-b576-9c491a83c66b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
143	0104d2f4-e14c-4def-9a7e-271cd57f467c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
144	3223c9dd-6ee5-4b75-9ae3-fbd345946168	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
145	284bba06-884d-4e4f-8fc0-fcc47b80fbe2	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
146	ff2a9ff2-e458-4226-97c8-bf423d0e459d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
147	098bf076-4f84-4c19-aa37-a34f24c49f56	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
148	eb7d0409-fa73-4cf5-beaa-666e2fe09d4d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
149	c37afb7d-8790-471b-bc57-928bf7846302	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
150	4d162726-b1f7-46fc-9ddc-bd4d2b6162f0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
151	7db640b4-db6e-40b3-9b42-cc682392002d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
152	0759fe6a-506c-4add-936d-c95dc0ca57ad	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
153	e8f5178c-974f-4e8d-ab24-2fcb019d74e8	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
154	eb0b7df0-d9e1-4173-ba58-063691eea96a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
155	9fb38331-2f8f-4985-a4a4-02c000477c8c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
156	c7c274be-9324-46f0-a68d-192686c6de33	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
157	41930bf4-ed80-4fbe-afa7-5a5422e5d681	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
158	75a70e1a-f98a-49e2-96f0-e392efda9cd0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
159	59708ef5-adbc-446f-873c-f622e066658f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
160	7da382a7-77b2-48a8-b2fb-fc831d2032a7	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
161	d63321c7-71c0-4257-932f-b1a5769f9a4e	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
162	86ac4178-8124-48c7-b686-31e9ad9c5a61	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
163	a045c066-c405-4dbf-a9a4-a96f9a93f3d1	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
164	e500bd9c-0267-421c-876e-142062bc1853	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
165	30261060-9c18-4aea-85a3-7bf2c8e030f2	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
166	f480a987-0320-4646-8d08-d37c4f3a4ecc	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
167	eee9fdc9-5c86-4926-bd3b-9f8c6fe9c9e6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
168	980df7e7-c4de-4c3a-b3f0-7fa2285eb40d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
169	bbea5dfe-06ae-4260-abeb-4a0ad41a46f6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
170	1f485969-126b-42e2-a2af-a2b005b3e3e9	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
171	b77fbb0c-9b52-42d1-a120-cd77c0f18f06	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
172	3a0a42cd-884c-46fd-a281-a8bac4077bbc	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
173	969e4d23-ea85-4095-9c69-0ab5904adc89	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
174	d78274e5-653e-4a59-b5f9-3374793859f3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
175	53b3a056-c33f-499e-be1a-4d5e2c3403e6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
176	5353cd21-78d6-458b-b712-5533da692136	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
177	fed99d3d-c03e-4ec7-8506-55db0e659c70	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
178	3e7b4f64-00f1-4851-855f-917b31a8079a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
179	171631a6-17f7-4da0-9ffa-022e65090d4a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
180	45c1774f-231b-478c-baf4-dbcadd1c8842	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
181	a2dcf7c4-015a-48c9-95e9-42eabb46dce0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
182	73b706da-d24d-40b6-a8ab-3ae68f0197db	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
183	5906e484-dc2c-40a4-a5fd-78a96d624758	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
184	3359ab5c-18ee-4ff2-9135-307443962b15	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
185	c2ae72d5-7dcb-4117-963b-5cbd42e7115a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
186	d9c2ecd7-dab6-4f26-888e-f86b3ca1a996	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
187	1e415deb-e02e-450c-b59c-d5510b7d10f2	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
188	59f6eb2b-0b68-4aac-b422-f6aa99511063	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
189	9169d064-9ee0-475e-b5a8-43628cc5b276	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
190	82b17bfd-5331-4427-9a8d-6f46f66c0f79	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
191	72aa8647-d8a0-42da-b72e-dd75b0dbdd6c	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
192	aff8ad21-0072-4494-9e40-c3bfc6d9a381	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
193	b255a132-193b-4b06-a971-ffc5f2a3de3a	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
194	cc0868cd-c3f8-45b2-bc6f-018865ff9f05	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
195	9958a6b0-34e5-4425-95c1-86faa79bedf1	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
196	4bd8c5ee-ff4a-4ef3-9a25-282372568fb7	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
197	ae4c958a-09cb-4eb4-81a4-bdb93854438f	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
198	cebac26f-be33-4f0f-9bf9-8dcd2ad88c23	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
199	23ac8bc2-4322-4691-871e-ebd6cef7cfd3	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
200	cf84a1f5-da53-41f7-a2bf-5ac4a6a217af	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
201	2b9b37ba-db22-467d-8aa1-95e5fef0a136	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
202	77cec52a-cca4-45f0-b4f2-358b043dc455	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
203	fb84d073-8ee2-41e0-af48-b9df4e049c54	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
204	43df7202-76dd-43dd-8421-536416cfcc6e	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
205	6d112dff-82d3-4f62-990a-a43c87106bda	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
206	2720b5cc-d674-4990-9ff5-f3d34e8aa299	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
207	773d34d9-ba96-4f58-a182-c55b14156d77	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
208	e4335811-ac4c-435b-b4cd-7059fd83ab13	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
209	ac7040b7-fa97-4f9c-ac1d-6565122b2a73	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
210	7a4b1ebf-965a-40f9-8067-30304992f585	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
211	c1ad1b8e-5300-4d85-b677-679f8323feba	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
212	efdf9962-e832-4084-9a07-b8f1137ecee6	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
213	8b4a7c14-a1b6-467e-8d9f-66baf308a907	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
214	d8838e09-aa10-4b61-83d3-58a2e8cd5176	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
215	16cfdd72-3b1e-48c8-ad26-dcd971e33323	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
216	7c1df37a-b098-4668-bd78-5d9c8f144783	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
217	cbfd70fc-8d44-43ee-9fc9-759183c77094	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
218	0dee1ed9-dd81-4a8f-8862-32d8f4429d87	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
219	3694d418-e4b7-402d-8ddf-a83f268bf803	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
220	5532ddfa-8584-4266-9b08-46a5f4dc520d	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
221	c91cf12c-f551-4157-8c3a-41196785ded5	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
222	52d22143-a4b0-41de-a2e2-487daa0e17f0	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
223	74d794ae-39d8-4bdb-91c0-ee3c5784dd2b	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
224	dee260ab-47dd-49a0-92b0-e1e57443e7f8	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
225	1acd3425-e9c8-4f7c-882a-2b0402374727	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
226	cb0a368c-f1c3-4af4-be3f-1e6799676994	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
227	f8117829-8122-40bf-8985-f29cb0a0e1aa	NEW	ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:37:18.476492
228	d7e7e52b-ec77-4494-80dd-c55ed36816f7	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
229	6333de00-b21d-4bab-8ce0-19921dadc2fa	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
230	1a032539-9a4a-4805-8b07-6ebd6aceec91	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
231	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
232	ecf3c70a-ef04-4442-b913-f70e4dee1b17	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
233	563d6af6-4c01-40c8-99d3-1e65aafe27cc	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
234	31e33e6a-99d0-4004-ac72-2265d9f5d012	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
235	a3b76924-9822-4e28-8aab-c7fb81daba01	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
236	da269c9d-031c-48c9-898a-e68d94a8d5b6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
237	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
238	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
239	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
240	8463c290-4d93-4e90-9d3b-c0a798eff6a3	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
241	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
242	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
243	667ca3a6-212d-4669-a4da-50224377399e	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
244	ea2f00b2-bf51-42d0-8407-2981cd02f964	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
245	2f2ba06d-9233-422f-853b-20ed45f6bebe	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
246	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
247	9070b23b-8612-4242-acb4-05f0472e168b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
248	ed44058a-9772-481c-a9b7-eee3af0380f6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
249	30cb7537-0817-423b-8e57-132cb8514e83	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
250	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
251	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
252	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
253	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
254	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
255	c5739442-e088-4082-8ba9-369309ce896b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
256	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
257	96ea73d5-f80d-4a76-803f-44ae4acbbf06	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
258	5f209a49-159c-4798-b32d-62b9afe33eb0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
259	117c1d82-6651-48ba-9ae0-8e37b3020062	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
260	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
261	c52c9aa5-f227-4631-b43a-19ffdfd0917c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
262	9b763dda-f572-46ae-b140-01d7ed0a39a0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
263	25774ac1-fd82-4f3a-b6c2-df0beceef04d	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
264	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
265	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
266	377cadec-13ac-483f-b592-f8c0c65a6913	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
267	7a7bba31-0a14-44d6-b7ce-4d4626be3957	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
268	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
269	e5491fc8-112e-41c8-96c2-091f40c56cfb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
270	1f4e7b7e-54b8-42aa-95bc-6e4916258435	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
271	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
272	8ce33615-a30a-415f-9a37-ef685af1fded	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
273	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
274	95d0cf64-841f-43a7-a738-ac2f78e5716b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
275	d5e96494-d4f4-4529-8e7b-3664920dbbda	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
276	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
277	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
278	56822283-8d34-4d84-9ceb-6281acf28d5b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
279	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
280	45b681df-e2b3-4a09-8ae0-16684d33b588	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
281	f03e7a35-00c5-496d-8388-84971fc67c2c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
282	8835717d-c031-4d9a-9af3-20f5b18720d4	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
283	53a5203c-e09f-492a-b59b-5d50d8f1aea1	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
284	b9baa47f-3a0a-4120-88e8-cba154fde4f6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
285	af260e05-2819-44b4-8836-06e474b70647	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
286	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
287	b89dd81c-0b41-4c3d-aee1-28340321c151	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
288	3df5d081-ebb8-4110-919f-f496340287b5	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
289	f80207a8-caaa-4f75-b352-eb504ae2cf31	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
290	583b01c8-510f-4196-ae00-674098ae9408	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
291	336cd48d-1851-47d6-83df-d835dc1836fb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
292	cf521eec-7a13-4e1f-af64-b4575b75dc02	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
293	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
294	01b11d7d-39c4-4caa-8c7b-eee772073f4f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
295	f08f63b0-e11c-452a-8495-3daa7a300352	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
296	f0034829-f39c-4ce2-886c-6c01c5f8e444	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
297	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
298	c977629e-3832-4007-a4b6-85d3a6078cab	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
299	531cdd4f-c162-4dcd-b835-151ca9108f67	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
300	87b5c971-d56c-4841-8d97-71727fa4ff3a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
301	db9f26d3-7f3c-4d94-ae27-b5509b898b18	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
302	0d2299a4-85c2-4879-b2a8-f660e8029ca9	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
303	0285ab05-f8a0-40bc-8afc-a62c809390a2	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
304	23a242ab-a89d-4300-9e70-65b8c90e3e15	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
305	27f7ef14-b75a-424b-bfbe-a04c5ef17b23	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
306	d5016148-0706-47bf-80b7-7ebe9cf743e8	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
307	cc91dbf5-a3f1-4e18-850a-398a4019b2f0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
308	48e66621-df13-4329-948a-866d11f8ebcb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
309	2d150789-f709-49b1-b9f7-9e9e3adf9ef9	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
310	3ffb2994-71a5-4887-a02e-f61b7478e970	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
311	3b895f2c-cb89-412c-9b92-a08e68b28c43	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
312	9fd8e422-6838-4680-892d-63685ccec416	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
313	5d7268c0-706c-4852-86f4-f63df4a9b162	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
314	5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
315	e07a60d2-437e-4a94-8858-fa79185a0cf4	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
316	fe0c0c98-b7b8-4870-9de2-3aff7306dddf	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
317	12c73d29-ff5f-4112-a842-48f1caa975a3	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
318	3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
319	d19037dd-2c6f-4cb7-9054-9405ea57feda	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
320	68c21441-cf92-4da9-b6ae-10bf6067dfcd	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
321	5e7ccade-69e5-4d15-9196-651154d1c573	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
322	3b76644e-54a3-47aa-a273-83edb9a89e68	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
323	72fd3fef-00c3-490b-b091-66a346e978d3	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
324	92d0e9e1-c713-460b-8c23-6ff5a58e0d90	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
325	c08ceff3-c2ff-4f70-ab1e-3b91220383cb	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
326	c485653c-c417-4422-873e-20882a65ed85	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
327	f54e22f2-ad4d-42a9-bfac-e44426d1c863	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
328	9d5092e0-8f2d-460a-b012-58f79ce3bfcc	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
329	51b59706-d48e-4dcd-b502-ff57d67f129f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
330	bf342654-c4b1-459d-89cc-86e547fb0fa0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
331	89ccb6d7-4c6d-44ce-8504-e3752b6df937	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
332	45ec03be-4edc-48a0-8c9d-d7c900968bd8	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
333	b09e8b38-9b9f-48b5-ac08-77a19b8a0420	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
334	705fa979-ccff-4768-a768-2f7868fa163b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
335	cf0d8fe7-e0a5-4fcf-8790-e991f7c67443	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
336	8e4e0ff0-c56d-4e5a-8d89-0d814d8e4cb0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
337	0f059491-617c-4030-998a-3940b7ec9d6a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
338	3f6aa06a-b2b7-4827-9f73-05e26b7d0f75	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
339	96b121fa-ca41-4d40-9ede-4f61c93a0f7a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
340	b9fce5e9-6612-4dd6-8ad4-958467abbd3c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
341	685f2a15-c3f0-4d4e-88c1-0c6ad3fe93b5	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
342	53c52bf7-5639-4a39-b576-9c491a83c66b	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
343	0104d2f4-e14c-4def-9a7e-271cd57f467c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
344	3223c9dd-6ee5-4b75-9ae3-fbd345946168	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
345	284bba06-884d-4e4f-8fc0-fcc47b80fbe2	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
346	ff2a9ff2-e458-4226-97c8-bf423d0e459d	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
347	098bf076-4f84-4c19-aa37-a34f24c49f56	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
348	eb7d0409-fa73-4cf5-beaa-666e2fe09d4d	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
349	c37afb7d-8790-471b-bc57-928bf7846302	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
350	4d162726-b1f7-46fc-9ddc-bd4d2b6162f0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
351	7db640b4-db6e-40b3-9b42-cc682392002d	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
352	0759fe6a-506c-4add-936d-c95dc0ca57ad	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
353	e8f5178c-974f-4e8d-ab24-2fcb019d74e8	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
354	eb0b7df0-d9e1-4173-ba58-063691eea96a	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
355	9fb38331-2f8f-4985-a4a4-02c000477c8c	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
356	c7c274be-9324-46f0-a68d-192686c6de33	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
357	41930bf4-ed80-4fbe-afa7-5a5422e5d681	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
358	75a70e1a-f98a-49e2-96f0-e392efda9cd0	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
359	59708ef5-adbc-446f-873c-f622e066658f	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
360	7da382a7-77b2-48a8-b2fb-fc831d2032a7	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
361	d63321c7-71c0-4257-932f-b1a5769f9a4e	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
362	86ac4178-8124-48c7-b686-31e9ad9c5a61	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
363	a045c066-c405-4dbf-a9a4-a96f9a93f3d1	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
364	e500bd9c-0267-421c-876e-142062bc1853	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
365	30261060-9c18-4aea-85a3-7bf2c8e030f2	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
366	f480a987-0320-4646-8d08-d37c4f3a4ecc	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
367	eee9fdc9-5c86-4926-bd3b-9f8c6fe9c9e6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
368	980df7e7-c4de-4c3a-b3f0-7fa2285eb40d	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
369	bbea5dfe-06ae-4260-abeb-4a0ad41a46f6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
370	1f485969-126b-42e2-a2af-a2b005b3e3e9	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
371	b77fbb0c-9b52-42d1-a120-cd77c0f18f06	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
372	3a0a42cd-884c-46fd-a281-a8bac4077bbc	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
373	969e4d23-ea85-4095-9c69-0ab5904adc89	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
374	d78274e5-653e-4a59-b5f9-3374793859f3	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
375	53b3a056-c33f-499e-be1a-4d5e2c3403e6	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
376	5353cd21-78d6-458b-b712-5533da692136	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
377	fed99d3d-c03e-4ec7-8506-55db0e659c70	ASSIGNED	CONTACTED	\N	SYSTEM	\N	2026-03-04 03:37:18.490045
378	d7e7e52b-ec77-4494-80dd-c55ed36816f7	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
379	6333de00-b21d-4bab-8ce0-19921dadc2fa	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
380	1a032539-9a4a-4805-8b07-6ebd6aceec91	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
381	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
382	ecf3c70a-ef04-4442-b913-f70e4dee1b17	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
383	563d6af6-4c01-40c8-99d3-1e65aafe27cc	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
384	31e33e6a-99d0-4004-ac72-2265d9f5d012	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
385	a3b76924-9822-4e28-8aab-c7fb81daba01	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
386	da269c9d-031c-48c9-898a-e68d94a8d5b6	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
387	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
388	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
389	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
390	8463c290-4d93-4e90-9d3b-c0a798eff6a3	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
391	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
392	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
393	667ca3a6-212d-4669-a4da-50224377399e	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
394	ea2f00b2-bf51-42d0-8407-2981cd02f964	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
395	2f2ba06d-9233-422f-853b-20ed45f6bebe	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
396	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
397	9070b23b-8612-4242-acb4-05f0472e168b	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
398	ed44058a-9772-481c-a9b7-eee3af0380f6	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
399	30cb7537-0817-423b-8e57-132cb8514e83	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
400	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
401	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
402	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
403	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
404	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
405	c5739442-e088-4082-8ba9-369309ce896b	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
406	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
407	96ea73d5-f80d-4a76-803f-44ae4acbbf06	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
408	5f209a49-159c-4798-b32d-62b9afe33eb0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
409	117c1d82-6651-48ba-9ae0-8e37b3020062	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
410	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
411	c52c9aa5-f227-4631-b43a-19ffdfd0917c	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
412	9b763dda-f572-46ae-b140-01d7ed0a39a0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
413	25774ac1-fd82-4f3a-b6c2-df0beceef04d	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
414	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
415	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
416	377cadec-13ac-483f-b592-f8c0c65a6913	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
417	7a7bba31-0a14-44d6-b7ce-4d4626be3957	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
418	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
419	e5491fc8-112e-41c8-96c2-091f40c56cfb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
420	1f4e7b7e-54b8-42aa-95bc-6e4916258435	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
421	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
422	8ce33615-a30a-415f-9a37-ef685af1fded	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
423	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
424	95d0cf64-841f-43a7-a738-ac2f78e5716b	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
425	d5e96494-d4f4-4529-8e7b-3664920dbbda	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
426	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
427	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
428	56822283-8d34-4d84-9ceb-6281acf28d5b	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
429	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
430	45b681df-e2b3-4a09-8ae0-16684d33b588	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
431	f03e7a35-00c5-496d-8388-84971fc67c2c	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
432	8835717d-c031-4d9a-9af3-20f5b18720d4	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
433	53a5203c-e09f-492a-b59b-5d50d8f1aea1	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
434	b9baa47f-3a0a-4120-88e8-cba154fde4f6	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
435	af260e05-2819-44b4-8836-06e474b70647	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
436	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
437	b89dd81c-0b41-4c3d-aee1-28340321c151	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
438	3df5d081-ebb8-4110-919f-f496340287b5	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
439	f80207a8-caaa-4f75-b352-eb504ae2cf31	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
440	583b01c8-510f-4196-ae00-674098ae9408	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
441	336cd48d-1851-47d6-83df-d835dc1836fb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
442	cf521eec-7a13-4e1f-af64-b4575b75dc02	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
443	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
444	01b11d7d-39c4-4caa-8c7b-eee772073f4f	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
445	f08f63b0-e11c-452a-8495-3daa7a300352	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
446	f0034829-f39c-4ce2-886c-6c01c5f8e444	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
447	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
448	c977629e-3832-4007-a4b6-85d3a6078cab	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
449	531cdd4f-c162-4dcd-b835-151ca9108f67	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
450	87b5c971-d56c-4841-8d97-71727fa4ff3a	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
451	db9f26d3-7f3c-4d94-ae27-b5509b898b18	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
452	0d2299a4-85c2-4879-b2a8-f660e8029ca9	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
453	0285ab05-f8a0-40bc-8afc-a62c809390a2	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
454	23a242ab-a89d-4300-9e70-65b8c90e3e15	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
455	27f7ef14-b75a-424b-bfbe-a04c5ef17b23	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
456	d5016148-0706-47bf-80b7-7ebe9cf743e8	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
457	cc91dbf5-a3f1-4e18-850a-398a4019b2f0	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
458	48e66621-df13-4329-948a-866d11f8ebcb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
459	2d150789-f709-49b1-b9f7-9e9e3adf9ef9	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
460	3ffb2994-71a5-4887-a02e-f61b7478e970	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
461	3b895f2c-cb89-412c-9b92-a08e68b28c43	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
462	9fd8e422-6838-4680-892d-63685ccec416	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
463	5d7268c0-706c-4852-86f4-f63df4a9b162	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
464	5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
465	e07a60d2-437e-4a94-8858-fa79185a0cf4	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
466	fe0c0c98-b7b8-4870-9de2-3aff7306dddf	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
467	12c73d29-ff5f-4112-a842-48f1caa975a3	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
468	3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
469	d19037dd-2c6f-4cb7-9054-9405ea57feda	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
470	68c21441-cf92-4da9-b6ae-10bf6067dfcd	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
471	5e7ccade-69e5-4d15-9196-651154d1c573	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
472	3b76644e-54a3-47aa-a273-83edb9a89e68	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
473	72fd3fef-00c3-490b-b091-66a346e978d3	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
474	92d0e9e1-c713-460b-8c23-6ff5a58e0d90	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
475	c08ceff3-c2ff-4f70-ab1e-3b91220383cb	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
476	c485653c-c417-4422-873e-20882a65ed85	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
477	f54e22f2-ad4d-42a9-bfac-e44426d1c863	CONTACTED	VISIT_REQUESTED	\N	SYSTEM	\N	2026-03-04 03:37:18.502913
478	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:37:18.51894
479	1eafc6c6-5af9-4b03-82c0-17503007149a	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
480	2408cace-27a2-497b-95b2-51d3f1e379d0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
481	fc5a4620-4644-4aa4-a559-dfbe20334c97	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
482	d7e7e52b-ec77-4494-80dd-c55ed36816f7	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
483	6333de00-b21d-4bab-8ce0-19921dadc2fa	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
484	1a032539-9a4a-4805-8b07-6ebd6aceec91	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
485	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
486	ecf3c70a-ef04-4442-b913-f70e4dee1b17	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
487	563d6af6-4c01-40c8-99d3-1e65aafe27cc	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
488	31e33e6a-99d0-4004-ac72-2265d9f5d012	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
489	a3b76924-9822-4e28-8aab-c7fb81daba01	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
490	da269c9d-031c-48c9-898a-e68d94a8d5b6	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
491	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
492	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
493	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
494	8463c290-4d93-4e90-9d3b-c0a798eff6a3	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
495	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
496	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
497	667ca3a6-212d-4669-a4da-50224377399e	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
498	ea2f00b2-bf51-42d0-8407-2981cd02f964	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
499	2f2ba06d-9233-422f-853b-20ed45f6bebe	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
500	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
501	9070b23b-8612-4242-acb4-05f0472e168b	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
502	ed44058a-9772-481c-a9b7-eee3af0380f6	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
503	30cb7537-0817-423b-8e57-132cb8514e83	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
504	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
505	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
506	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
507	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
508	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
509	c5739442-e088-4082-8ba9-369309ce896b	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
510	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
511	96ea73d5-f80d-4a76-803f-44ae4acbbf06	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
512	5f209a49-159c-4798-b32d-62b9afe33eb0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
513	117c1d82-6651-48ba-9ae0-8e37b3020062	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
514	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
515	c52c9aa5-f227-4631-b43a-19ffdfd0917c	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
516	9b763dda-f572-46ae-b140-01d7ed0a39a0	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
517	25774ac1-fd82-4f3a-b6c2-df0beceef04d	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
518	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
519	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
520	377cadec-13ac-483f-b592-f8c0c65a6913	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
521	7a7bba31-0a14-44d6-b7ce-4d4626be3957	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
522	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
523	e5491fc8-112e-41c8-96c2-091f40c56cfb	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
524	1f4e7b7e-54b8-42aa-95bc-6e4916258435	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
525	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
526	8ce33615-a30a-415f-9a37-ef685af1fded	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
527	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
528	95d0cf64-841f-43a7-a738-ac2f78e5716b	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
529	d5e96494-d4f4-4529-8e7b-3664920dbbda	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
530	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
531	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
532	56822283-8d34-4d84-9ceb-6281acf28d5b	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
533	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
534	45b681df-e2b3-4a09-8ae0-16684d33b588	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
535	f03e7a35-00c5-496d-8388-84971fc67c2c	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
536	8835717d-c031-4d9a-9af3-20f5b18720d4	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
537	53a5203c-e09f-492a-b59b-5d50d8f1aea1	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
538	b9baa47f-3a0a-4120-88e8-cba154fde4f6	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
539	af260e05-2819-44b4-8836-06e474b70647	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
540	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
541	b89dd81c-0b41-4c3d-aee1-28340321c151	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
542	3df5d081-ebb8-4110-919f-f496340287b5	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
543	f80207a8-caaa-4f75-b352-eb504ae2cf31	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
544	583b01c8-510f-4196-ae00-674098ae9408	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
545	336cd48d-1851-47d6-83df-d835dc1836fb	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
546	cf521eec-7a13-4e1f-af64-b4575b75dc02	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
547	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
548	01b11d7d-39c4-4caa-8c7b-eee772073f4f	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
549	f08f63b0-e11c-452a-8495-3daa7a300352	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
550	f0034829-f39c-4ce2-886c-6c01c5f8e444	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
551	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
552	c977629e-3832-4007-a4b6-85d3a6078cab	VISIT_REQUESTED	VISIT_ASSIGNED	\N	SYSTEM	\N	2026-03-04 03:39:46.871095
553	1eafc6c6-5af9-4b03-82c0-17503007149a	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
554	2408cace-27a2-497b-95b2-51d3f1e379d0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
555	fc5a4620-4644-4aa4-a559-dfbe20334c97	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
556	d7e7e52b-ec77-4494-80dd-c55ed36816f7	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
557	6333de00-b21d-4bab-8ce0-19921dadc2fa	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
558	1a032539-9a4a-4805-8b07-6ebd6aceec91	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
559	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
560	8463c290-4d93-4e90-9d3b-c0a798eff6a3	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
561	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
562	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
563	667ca3a6-212d-4669-a4da-50224377399e	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
564	ea2f00b2-bf51-42d0-8407-2981cd02f964	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
565	2f2ba06d-9233-422f-853b-20ed45f6bebe	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
566	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
567	9070b23b-8612-4242-acb4-05f0472e168b	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
568	ed44058a-9772-481c-a9b7-eee3af0380f6	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
569	30cb7537-0817-423b-8e57-132cb8514e83	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
570	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
571	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
572	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
573	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
574	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
575	c5739442-e088-4082-8ba9-369309ce896b	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
576	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
577	96ea73d5-f80d-4a76-803f-44ae4acbbf06	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
578	5f209a49-159c-4798-b32d-62b9afe33eb0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
579	117c1d82-6651-48ba-9ae0-8e37b3020062	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
580	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
581	c52c9aa5-f227-4631-b43a-19ffdfd0917c	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
582	9b763dda-f572-46ae-b140-01d7ed0a39a0	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
583	25774ac1-fd82-4f3a-b6c2-df0beceef04d	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
584	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
585	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
586	377cadec-13ac-483f-b592-f8c0c65a6913	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
587	7a7bba31-0a14-44d6-b7ce-4d4626be3957	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
588	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
589	e5491fc8-112e-41c8-96c2-091f40c56cfb	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
590	1f4e7b7e-54b8-42aa-95bc-6e4916258435	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
591	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
592	8ce33615-a30a-415f-9a37-ef685af1fded	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
593	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
594	95d0cf64-841f-43a7-a738-ac2f78e5716b	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
595	d5e96494-d4f4-4529-8e7b-3664920dbbda	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
596	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
597	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
598	56822283-8d34-4d84-9ceb-6281acf28d5b	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
599	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
600	45b681df-e2b3-4a09-8ae0-16684d33b588	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
601	f03e7a35-00c5-496d-8388-84971fc67c2c	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
602	8835717d-c031-4d9a-9af3-20f5b18720d4	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
603	53a5203c-e09f-492a-b59b-5d50d8f1aea1	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
604	b9baa47f-3a0a-4120-88e8-cba154fde4f6	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
605	af260e05-2819-44b4-8836-06e474b70647	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
606	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
607	b89dd81c-0b41-4c3d-aee1-28340321c151	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
608	3df5d081-ebb8-4110-919f-f496340287b5	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
609	f80207a8-caaa-4f75-b352-eb504ae2cf31	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
610	cf521eec-7a13-4e1f-af64-b4575b75dc02	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
611	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
612	01b11d7d-39c4-4caa-8c7b-eee772073f4f	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
613	f08f63b0-e11c-452a-8495-3daa7a300352	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
614	f0034829-f39c-4ce2-886c-6c01c5f8e444	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
615	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
616	c977629e-3832-4007-a4b6-85d3a6078cab	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
617	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
618	ecf3c70a-ef04-4442-b913-f70e4dee1b17	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
619	563d6af6-4c01-40c8-99d3-1e65aafe27cc	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
620	31e33e6a-99d0-4004-ac72-2265d9f5d012	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
621	a3b76924-9822-4e28-8aab-c7fb81daba01	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
622	da269c9d-031c-48c9-898a-e68d94a8d5b6	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
623	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
624	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
625	583b01c8-510f-4196-ae00-674098ae9408	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
626	336cd48d-1851-47d6-83df-d835dc1836fb	VISIT_ASSIGNED	VISIT_COMPLETED	\N	SYSTEM	\N	2026-03-04 03:39:53.265146
627	2408cace-27a2-497b-95b2-51d3f1e379d0	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
628	fc5a4620-4644-4aa4-a559-dfbe20334c97	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
629	6333de00-b21d-4bab-8ce0-19921dadc2fa	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
630	8463c290-4d93-4e90-9d3b-c0a798eff6a3	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
631	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
632	667ca3a6-212d-4669-a4da-50224377399e	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
633	2f2ba06d-9233-422f-853b-20ed45f6bebe	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
634	9070b23b-8612-4242-acb4-05f0472e168b	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
635	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
636	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
637	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
638	c5739442-e088-4082-8ba9-369309ce896b	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
639	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
640	96ea73d5-f80d-4a76-803f-44ae4acbbf06	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
641	5f209a49-159c-4798-b32d-62b9afe33eb0	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
642	117c1d82-6651-48ba-9ae0-8e37b3020062	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
643	9b763dda-f572-46ae-b140-01d7ed0a39a0	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
644	25774ac1-fd82-4f3a-b6c2-df0beceef04d	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
645	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
646	7a7bba31-0a14-44d6-b7ce-4d4626be3957	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
647	1f4e7b7e-54b8-42aa-95bc-6e4916258435	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
648	8ce33615-a30a-415f-9a37-ef685af1fded	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
649	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
650	d5e96494-d4f4-4529-8e7b-3664920dbbda	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
651	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
652	56822283-8d34-4d84-9ceb-6281acf28d5b	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
653	45b681df-e2b3-4a09-8ae0-16684d33b588	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
654	53a5203c-e09f-492a-b59b-5d50d8f1aea1	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
655	af260e05-2819-44b4-8836-06e474b70647	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
656	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
657	b89dd81c-0b41-4c3d-aee1-28340321c151	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
658	3df5d081-ebb8-4110-919f-f496340287b5	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
659	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
660	01b11d7d-39c4-4caa-8c7b-eee772073f4f	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
661	ecf3c70a-ef04-4442-b913-f70e4dee1b17	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
662	563d6af6-4c01-40c8-99d3-1e65aafe27cc	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
663	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	VISIT_COMPLETED	SOLD	\N	SYSTEM	\N	2026-03-04 03:39:58.436044
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, farmer_name, phone_number, village, taluka, district, state, campaign_id, assigned_to, attempt_count, last_contacted_at, next_callback_at, drop_reason, drop_notes, crop_type, acreage, created_at, updated_at, status, farmer_type, bull_centre, total_land_bigha, interested_in_warehouse, previous_experience) FROM stdin;
1eafc6c6-5af9-4b03-82c0-17503007149a	Farmer A	9999999999	\N	\N	\N	\N	1b4c1703-20af-41c3-881b-e1acaf49d540	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	0	\N	\N	\N	\N	Cotton	5.00	2026-02-22 23:59:20.571219	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
2408cace-27a2-497b-95b2-51d3f1e379d0	Ramesh Updated	919876543210	Bardoli	\N	Surat	\N	\N	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	0	\N	\N	\N	\N	Cotton	\N	2026-03-03 18:34:31.501536	2026-03-04 03:39:58.436044	SOLD	Small	Centre B	5	t	Yes
fc5a4620-4644-4aa4-a559-dfbe20334c97	Devjibhai Rabari	9876500001	Idar	Idar	Sabarkantha	Gujarat	\N	8922127a-452d-4b67-ac08-35dbd00a854c	2	2026-03-04 00:18:40.022062	\N	\N	\N	Wheat	8.00	2026-03-03 23:48:03.904677	2026-03-04 03:39:58.436044	SOLD	PROGRESSIVE	North Gujarat	20	t	Sold to local trader
6333de00-b21d-4bab-8ce0-19921dadc2fa	Farmer 5	9930000005	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.70	2026-02-13 02:49:00.412021	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
8463c290-4d93-4e90-9d3b-c0a798eff6a3	Farmer 18	9930000018	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.88	2026-02-21 00:42:02.692043	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
aaca43ff-6124-40b5-bf3c-d202ab156f31	Farmer 1	9930000001	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 13:41:24.64445	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
2b4e96e8-7722-4453-bbfe-2de75975d442	Farmer 3	9930000003	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 08:29:28.068609	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
7a4bb31b-8384-4e6b-bd9d-3255a8d9ce99	Farmer 4	9930000004	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 22:53:54.601836	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
2beebffd-6c4e-4698-9698-d0d47c899fa3	Rameshbhai Patel	9876543210	Anandpur	Borsad	Anand	Gujarat	\N	\N	0	\N	\N	\N	\N	Cotton	5.50	2026-03-03 22:46:25.121295	2026-03-03 22:46:25.121295	NEW	SMALL	Anand Hub	8	t	Has sold through APMC before
d1ea19f5-0628-4ed9-8192-cc3477d3b77c	Maheshbhai Chaudhary	9825012345	Lunawada	Lunawada	Mahisagar	Gujarat	\N	\N	0	\N	\N	\N	\N	Wheat	12.00	2026-03-03 22:46:52.767443	2026-03-03 22:46:52.767443	NEW	MEDIUM	Vadodara Hub	15	f	New to warehouse model
1306e5e3-781d-4777-ba4a-35cdb79b0326	Farmer 8	9930000008	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 17:52:25.272988	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
d7e7e52b-ec77-4494-80dd-c55ed36816f7	Farmer 2	9930000002	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.94	2026-02-10 07:38:08.43788	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
1a032539-9a4a-4805-8b07-6ebd6aceec91	Farmer 6	9930000006	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.74	2026-02-11 02:34:29.607552	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
675904cb-2e3f-4f18-994f-4bc1d061c9ed	Kiritbhai Desai	9898989898	Dharmaj	Petlad	Anand	Gujarat	\N	94fd2aca-2ce5-4614-ab03-d1885a22caba	0	\N	\N	\N	\N	Groundnut	20.00	2026-03-03 22:46:59.783931	2026-03-04 01:46:09.62516	VISIT_COMPLETED	LARGE	Anand Hub	25	t	Uses private traders currently
2487fa14-f28d-43ae-8bd6-7899fb7b07d0	Farmer 17	9930000017	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.61	2026-02-10 17:34:09.839344	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
d1cfb14d-12d2-4d29-8b8d-2ca94db7e4e1	Farmer 16	9930000016	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 01:42:47.886402	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
6f64d51d-988a-417f-a22f-678d343e8e83	Farmer 20	9930000020	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 09:45:08.571667	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
da1097b5-e602-4fb8-af1e-16ae93b0ef4d	Farmer 22	9930000022	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 06:42:34.586309	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
e463856c-68fb-49d6-b96b-f5bbb11f4566	Farmer 23	9930000023	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 10:56:10.03569	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
d730a446-6334-40e6-8d16-2a76f5381eff	Farmer 24	9930000024	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:04.059689	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
2fc86819-64c2-408f-90b8-6b39207aae3d	Farmer 25	9930000025	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 04:39:57.628194	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
654385a1-88c0-4c1f-8a02-0a5a836d6d78	Farmer 27	9930000027	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 00:54:50.997941	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
ce78bcec-eefd-49b9-9401-d36e56d39655	Farmer 28	9930000028	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 05:35:49.186026	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
78ceb843-1c3e-4e4f-94cc-8a700336e0b6	Farmer 29	9930000029	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 09:46:19.754447	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
5b285237-ec7d-41f2-ae03-f12045f5b8b0	Farmer 32	9930000032	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 08:53:17.52217	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
9665523e-9f86-4d74-80fb-3040cc125d4d	Farmer 37	9930000037	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 14:49:59.457388	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	Rameshbhai Patel	9090909090	Kosamba	Kamrej	Surat	Gujarat	\N	94fd2aca-2ce5-4614-ab03-d1885a22caba	3	2026-03-04 02:22:55.342844	\N	\N	\N	Cotton	8.50	2026-03-04 02:02:29.393971	2026-03-04 03:37:18.51894	SOLD	\N	\N	\N	\N	\N
7ff79c6a-ac63-4e11-9b21-5271a533b591	Farmer 41	9930000041	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 04:47:20.021191	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
6210d459-21cd-4147-afc8-e4635147c217	Farmer 46	9930000046	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 18:27:39.522871	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
2b729a22-4504-4fc7-ab9b-0e5d76eee9f6	Farmer 47	9930000047	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 16:40:31.947062	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
29043d02-b3f8-41d2-b76b-352c6ab7be0f	Farmer 49	9930000049	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 21:43:48.496598	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
4400e6fa-22cf-4f3d-84ea-ed2d2f0c1c33	Farmer 53	9930000053	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 23:51:07.059116	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
007cb8c7-ce7e-41c4-8473-e2186850664c	Farmer 55	9930000055	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 05:35:37.982421	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a6f9a47e-3ad4-4130-959f-06d0e30f1c58	Farmer 57	9930000057	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 10:23:00.379916	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
f0be51c0-e320-4c33-876e-2e7bc20639c2	Farmer 60	9930000060	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 20:27:26.670197	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
84ebc5a4-9f5d-41de-a521-2889a628fb46	Farmer 61	9930000061	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 06:40:50.646691	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
9f3b5ed2-d269-42cc-bfb9-836b5f2fa63e	Farmer 62	9930000062	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-21 20:49:17.452703	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a4bf24ba-0045-4b05-8913-7b140f6db85a	Farmer 67	9930000067	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 05:56:46.990697	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
f9f2955a-2fb2-4dc8-8536-8443e5f17278	Farmer 74	9930000074	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 18:37:00.27079	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
ee8352a8-ddc3-4aa6-a76b-14e84695ed51	Farmer 76	9930000076	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 19:57:48.804927	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
e1a7d232-1305-45da-88b7-1029cab86180	Farmer 78	9930000078	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 13:06:23.993544	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
67b84c3f-7eeb-489b-ad5d-aa8b1e708699	Farmer 81	9930000081	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 02:15:54.962315	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
0b13250d-14f3-43e0-8ea1-53ba0594d992	Farmer 82	9930000082	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 08:58:57.567679	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
c913af2a-2a27-4505-bb2f-c1ff5ef7b7b1	Farmer 83	9930000083	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 10:25:41.520124	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
23734e7f-08fc-4fe4-aa8e-cfba3e109478	Farmer 84	9930000084	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 08:25:14.364651	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
8d709547-16a9-4ab9-a900-a3b032b216dd	Farmer 86	9930000086	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 17:05:15.294023	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
cca9fbd6-891c-4a36-abc3-cc29e77ecbbd	Farmer 87	9930000087	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 20:31:11.393314	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
72faddef-d85c-4e25-9a93-6d2f6ecb81e3	Farmer 89	9930000089	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 12:42:41.255157	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
dd71a0f1-1c21-4e91-a689-d42c74b5fd50	Farmer 90	9930000090	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 14:47:14.121191	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
fd20eea0-dda9-48ee-aebb-d1712847a41e	Farmer 97	9930000097	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 16:22:12.509994	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
b2345f91-7121-4667-a1b8-db4032964bce	Farmer 98	9930000098	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 14:39:33.592993	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
970cc4fa-292f-422f-b425-02b129da6ccb	Farmer 99	9930000099	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 04:43:40.874237	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
677b6096-a95b-49a5-9860-d1ae37fe311c	Farmer 100	9930000100	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 19:30:44.435668	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
7e789303-f567-486f-aaa6-0e84c2528183	Farmer 101	9930000101	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 15:42:09.036684	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
b121ac2b-0b79-432c-b8f2-eede88bff2bd	Farmer 102	9930000102	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 21:55:13.497653	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
3b2564b9-0472-4b7e-bf9e-3998fae907e1	Farmer 103	9930000103	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 00:21:41.581127	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
90262870-a4e6-444a-9295-3f5c2f933a57	Farmer 110	9930000110	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 05:34:42.551276	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
4615da6c-3f13-404f-917b-5f95b827273d	Farmer 115	9930000115	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 15:38:42.805856	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
128e9cd3-f237-46ca-81b5-aa053652352e	Farmer 117	9930000117	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 08:34:49.912268	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
7e1df211-ad46-4db2-b167-cf348673c9f5	Farmer 119	9930000119	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 02:31:16.133597	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
9077e778-8507-43e6-abd2-2d8bd386be90	Farmer 123	9930000123	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 20:14:34.518536	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
0ca52a9f-57d6-4ef5-928c-2cdff4ef8379	Farmer 127	9930000127	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-04 01:38:15.815355	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
3888d513-0491-4f59-9272-6b2925570ae1	Farmer 129	9930000129	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-21 16:50:34.388635	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
d52f1e6d-7cd8-45b7-97ae-bd26211d7980	Farmer 21	9930000021	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.39	2026-02-09 05:07:58.053702	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
adcdd400-e7eb-4827-bf3e-24b969cfdfc0	Farmer 19	9930000019	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.54	2026-02-04 02:42:35.130867	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
667ca3a6-212d-4669-a4da-50224377399e	Farmer 26	9930000026	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.41	2026-02-04 00:04:09.663708	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
4fd056e6-41ab-4169-82ee-18aba06b7c3c	Farmer 137	9930000137	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 22:53:19.160241	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
b8069b92-fc4e-49cd-bbf2-40f82d374e1b	Farmer 138	9930000138	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 15:00:52.040397	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a01e6853-2f1f-4111-8565-d9cce56e433e	Farmer 140	9930000140	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 19:59:45.603887	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
e82d94f9-caba-47f6-ab7a-855ec1ca3904	Farmer 141	9930000141	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 05:55:45.551654	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
ad00bfc2-072c-40e9-b674-fee14497ed79	Farmer 142	9930000142	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 01:17:05.918541	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
c85bdc44-c4e1-4b39-b09f-0e5a126c4b8b	Farmer 143	9930000143	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 13:48:50.636951	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
81bfc58b-0495-493a-88cd-f59c3ebe6be2	Farmer 144	9930000144	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 16:39:00.459632	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
ea2f00b2-bf51-42d0-8407-2981cd02f964	Farmer 30	9930000030	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.70	2026-02-05 10:21:39.616826	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	Farmer 33	9930000033	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.83	2026-02-11 15:31:03.063963	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
ed44058a-9772-481c-a9b7-eee3af0380f6	Farmer 35	9930000035	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.95	2026-02-14 11:51:59.585436	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
44cf8109-8150-42a4-b36d-5fd9754a2cbe	Farmer 150	9930000150	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 06:52:35.952964	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
9b9d8b46-c3ac-4731-b984-e3613797acdd	Farmer 151	9930000151	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 01:25:50.504715	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
30cb7537-0817-423b-8e57-132cb8514e83	Farmer 36	9930000036	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.55	2026-02-16 21:09:23.448398	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	Farmer 38	9930000038	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.18	2026-02-14 06:37:35.918927	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
9851f18c-a4cc-47a6-8abc-c2552268f1f8	Farmer 154	9930000154	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 20:15:24.874861	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
05ad2b84-129e-42e5-824c-75071f035866	Farmer 155	9930000155	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 14:12:09.335962	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
3b5cae67-2f00-4d8e-9495-5b9d316d9a9a	Farmer 158	9930000158	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 14:19:43.843635	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	Farmer 42	9930000042	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.21	2026-02-04 01:19:32.061901	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
67fa9f07-4526-446c-add4-20c393eb65e6	Farmer 162	9930000162	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 23:39:53.771619	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
9d434d0d-1d80-4d77-80a1-d22fba0bdb65	Farmer 52	9930000052	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.54	2026-02-08 06:52:44.564727	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
c52c9aa5-f227-4631-b43a-19ffdfd0917c	Farmer 54	9930000054	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.58	2026-02-09 22:21:15.868794	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
2d283ad6-c548-448c-add1-9bf34f231c13	Farmer 170	9930000170	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 05:52:07.975702	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	Farmer 63	9930000063	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.12	2026-02-13 03:40:16.71369	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
377cadec-13ac-483f-b592-f8c0c65a6913	Farmer 64	9930000064	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.03	2026-02-13 11:52:25.497625	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
29b89000-09f4-4194-afbf-9096fd102cde	Farmer 176	9930000176	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 15:29:33.852239	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a9da5929-4329-425d-b80b-38a8ddc86801	Farmer 177	9930000177	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 11:48:53.294041	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
ebfdba8a-a666-42a0-a7b0-4af3e1f15263	Farmer 66	9930000066	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.71	2026-02-14 09:15:43.654868	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
406748fe-e1ce-4a9a-9f44-8c8507f08670	Farmer 179	9930000179	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 05:27:08.788688	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
e5491fc8-112e-41c8-96c2-091f40c56cfb	Farmer 68	9930000068	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.61	2026-02-15 05:12:52.55889	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
af05478a-f4d2-4330-ba87-e11507fd9a5d	Farmer 181	9930000181	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 02:37:17.87347	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
bc8dc8d4-abe9-4e55-8241-b1c2847ca272	Farmer 70	9930000070	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.46	2026-02-05 03:28:25.958543	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
95d0cf64-841f-43a7-a738-ac2f78e5716b	Farmer 73	9930000073	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.49	2026-02-09 03:02:51.372088	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
c65bab30-cc9d-4bcc-9ca6-be0e61191e39	Farmer 79	9930000079	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.30	2026-02-10 10:05:52.715166	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
021ef303-4801-4678-abc0-f657f8c19d77	Farmer 196	9930000196	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 22:20:12.164837	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
3e94dc03-a994-40c3-97e2-58fc5215b349	Farmer 198	9930000198	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 16:20:41.628766	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	Farmer 85	9930000085	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.92	2026-02-14 16:55:36.092538	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
f03e7a35-00c5-496d-8388-84971fc67c2c	Farmer 91	9930000091	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.31	2026-02-14 07:12:53.433723	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
8835717d-c031-4d9a-9af3-20f5b18720d4	Farmer 92	9930000092	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.88	2026-02-12 02:59:37.807887	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
b9baa47f-3a0a-4120-88e8-cba154fde4f6	Farmer 94	9930000094	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.50	2026-02-10 23:41:46.018835	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
3623b4ef-2dc1-4886-a9f9-3a83a6ddafa6	Farmer 205	9930000205	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 16:10:00.34138	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
4e9c6285-d533-43f6-ba4f-a39f30b198ca	Farmer 207	9930000207	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 16:49:03.331139	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
f80207a8-caaa-4f75-b352-eb504ae2cf31	Farmer 106	9930000106	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.43	2026-02-12 06:35:21.70354	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
1dcf0a73-dbbe-44d4-9823-ad81c7666e45	Farmer 212	9930000212	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 07:25:41.864068	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
da5f9185-22f6-4c71-8916-c41b673b3f58	Farmer 213	9930000213	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 21:49:26.468978	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
cf521eec-7a13-4e1f-af64-b4575b75dc02	Farmer 109	9930000109	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.03	2026-02-15 07:51:17.98979	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
fa9ff5f0-3ed0-407b-9189-7df4cdd3135e	Farmer 216	9930000216	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 13:10:38.209029	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
f08f63b0-e11c-452a-8495-3daa7a300352	Farmer 113	9930000113	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.56	2026-02-18 23:56:23.41744	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
f0034829-f39c-4ce2-886c-6c01c5f8e444	Farmer 114	9930000114	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.05	2026-02-15 08:12:03.491711	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
70c13121-6cfb-432a-a636-26c68ccb8a50	Farmer 220	9930000220	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 06:03:24.4713	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
5c732df0-c68d-45d0-a9d8-15e5fc9b1316	Farmer 116	9930000116	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.74	2026-02-07 02:51:11.204231	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
c977629e-3832-4007-a4b6-85d3a6078cab	Farmer 118	9930000118	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.66	2026-02-07 00:29:23.251142	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
2f2ba06d-9233-422f-853b-20ed45f6bebe	Farmer 31	9930000031	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.44	2026-02-16 14:31:46.252516	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
9070b23b-8612-4242-acb4-05f0472e168b	Farmer 34	9930000034	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.20	2026-02-13 15:40:43.807354	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
ff9e75e3-a4be-4059-89da-7d6f4a4163bc	Farmer 39	9930000039	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.14	2026-02-10 18:18:17.828557	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	Farmer 40	9930000040	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.76	2026-02-03 21:48:34.486083	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
89dd59bd-7a3f-4422-b70c-b0da758c2b7c	Farmer 43	9930000043	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.27	2026-02-17 17:39:11.312032	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
0d2129bc-744f-42b1-8bdf-7787426e4776	Farmer 228	9930000228	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 17:56:50.441563	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
c5739442-e088-4082-8ba9-369309ce896b	Farmer 44	9930000044	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.06	2026-02-08 00:15:33.026118	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
c6c4f1e3-a6ed-423b-be2c-e74cf85c5e94	Farmer 230	9930000230	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 02:24:56.437733	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
096bc5d6-77a2-4d13-93cf-8aa99a141ed0	Farmer 45	9930000045	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.45	2026-02-05 21:47:33.333696	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
6f712d90-9394-4285-9cfe-fe2f2d29ac10	Farmer 232	9930000232	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-02 06:34:03.683231	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
5a2d7424-38a7-4cf0-b293-eaa2a17299c9	Farmer 236	9930000236	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 06:02:15.348835	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
96ea73d5-f80d-4a76-803f-44ae4acbbf06	Farmer 48	9930000048	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.30	2026-02-10 07:59:56.292261	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
5f209a49-159c-4798-b32d-62b9afe33eb0	Farmer 50	9930000050	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.81	2026-02-05 10:56:21.577325	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
1595ae92-4a80-4bb9-846d-e86323ed7681	Farmer 242	9930000242	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 18:04:55.162452	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
117c1d82-6651-48ba-9ae0-8e37b3020062	Farmer 51	9930000051	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.36	2026-02-11 15:45:24.700351	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
9b763dda-f572-46ae-b140-01d7ed0a39a0	Farmer 56	9930000056	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.00	2026-02-13 18:43:44.110263	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
25774ac1-fd82-4f3a-b6c2-df0beceef04d	Farmer 58	9930000058	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.19	2026-02-02 11:47:05.552184	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	Farmer 59	9930000059	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.49	2026-02-13 20:08:05.654565	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
7a7bba31-0a14-44d6-b7ce-4d4626be3957	Farmer 65	9930000065	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.87	2026-02-11 13:19:13.494993	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
1f4e7b7e-54b8-42aa-95bc-6e4916258435	Farmer 69	9930000069	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.37	2026-02-15 16:35:46.686474	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
90d79585-5f6b-4a9d-b6f3-562e5072841e	Farmer 249	9930000249	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 05:08:52.830317	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
8ce33615-a30a-415f-9a37-ef685af1fded	Farmer 71	9930000071	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.72	2026-02-08 09:03:19.146267	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
f7e7eb21-9bda-426f-b171-25cc27a3d62d	Farmer 251	9930000251	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 08:53:01.728214	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
25a97581-906f-4ba8-b101-b5e8490b9945	Farmer 252	9930000252	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 18:45:56.027897	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
fc52f98d-b746-4836-bd36-c8d5ccbe46eb	Farmer 72	9930000072	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.51	2026-02-11 03:57:36.372945	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
9f03364e-a3ac-4cea-a140-9a735677d065	Farmer 254	9930000254	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-21 21:17:11.974795	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
052ccc31-4c86-499a-8253-6bf32ed5d3fd	Farmer 255	9930000255	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-23 13:43:27.575508	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
d5e96494-d4f4-4529-8e7b-3664920dbbda	Farmer 75	9930000075	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.04	2026-02-13 14:11:21.618037	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
49bfb5e3-f28b-426f-989b-a8e40178f070	Farmer 257	9930000257	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 18:08:53.697961	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	Farmer 77	9930000077	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.89	2026-02-05 03:09:18.828153	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
3ca9645a-598e-4def-bf6e-1becb2d67022	Farmer 259	9930000259	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-24 20:25:09.261214	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
56822283-8d34-4d84-9ceb-6281acf28d5b	Farmer 80	9930000080	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.09	2026-02-21 03:56:15.707456	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
45b681df-e2b3-4a09-8ae0-16684d33b588	Farmer 88	9930000088	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.40	2026-02-16 05:43:13.989806	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
53a5203c-e09f-492a-b59b-5d50d8f1aea1	Farmer 93	9930000093	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.28	2026-02-11 22:30:57.34784	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
af260e05-2819-44b4-8836-06e474b70647	Farmer 95	9930000095	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.62	2026-02-12 11:56:44.978316	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	Farmer 96	9930000096	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.45	2026-02-02 21:17:00.268714	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
b89dd81c-0b41-4c3d-aee1-28340321c151	Farmer 104	9930000104	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.88	2026-02-13 04:19:56.328192	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
3df5d081-ebb8-4110-919f-f496340287b5	Farmer 105	9930000105	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.13	2026-02-04 14:22:08.562586	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	Farmer 111	9930000111	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.05	2026-02-08 16:12:36.090064	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
01b11d7d-39c4-4caa-8c7b-eee772073f4f	Farmer 112	9930000112	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.70	2026-02-10 02:18:10.300026	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
5d185c00-bfeb-4a19-addf-779a77241d28	Farmer 270	9930000270	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-28 15:42:12.704163	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
fd6822b8-8d4c-4115-897b-24e43e71bfb0	Farmer 278	9930000278	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 21:50:28.854488	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
20170a5f-4ce2-45f0-a892-dc5f8c9ae5eb	Farmer 280	9930000280	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 14:00:30.1841	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
52565bc7-8636-4b0a-961b-1e225b2e929c	Farmer 281	9930000281	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 03:06:58.08272	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
c4818353-551d-4895-b0ea-a79fe66e1710	Farmer 284	9930000284	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-01 10:46:55.87936	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a5294ebf-b255-4b7a-97ea-39a695e2069e	Farmer 285	9930000285	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 11:46:39.008172	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
c5e07b73-3637-4458-8367-52f60a6caee9	Farmer 286	9930000286	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-26 13:27:32.354367	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
d540b9ec-a9ba-4784-b644-98cf2ae77f95	Farmer 288	9930000288	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-27 20:40:24.576219	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
a9b9e03c-0f71-4a9a-a21a-3c4835bd4b6f	Farmer 290	9930000290	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-22 05:27:37.263634	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
aa632fc7-161f-4b91-94e3-8b675f59028b	Farmer 293	9930000293	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-03-03 21:53:50.451323	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
312ab9a9-dc00-4fda-9848-ee684a3bdd0f	Farmer 7	9930000007	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.37	2026-02-07 04:43:04.44084	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
f6f94bdc-dab9-4f44-a4a8-6e867bd1c77e	Farmer 300	9930000300	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	\N	0	\N	\N	\N	\N	\N	\N	2026-02-25 22:12:48.770935	2026-03-04 03:37:18.453845	NEW	\N	\N	\N	\N	\N
31e33e6a-99d0-4004-ac72-2265d9f5d012	Farmer 11	9930000011	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.20	2026-02-03 17:17:55.996114	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
a3b76924-9822-4e28-8aab-c7fb81daba01	Farmer 12	9930000012	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.17	2026-02-06 08:04:56.921991	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
da269c9d-031c-48c9-898a-e68d94a8d5b6	Farmer 13	9930000013	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.03	2026-02-16 11:10:48.176879	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
ad15affc-42e9-40aa-a7c8-da8a1e6d323f	Farmer 15	9930000015	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.16	2026-02-05 22:25:45.557167	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
ecf3c70a-ef04-4442-b913-f70e4dee1b17	Farmer 9	9930000009	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.69	2026-02-04 20:52:45.733538	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
563d6af6-4c01-40c8-99d3-1e65aafe27cc	Farmer 10	9930000010	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.03	2026-02-19 05:36:15.418541	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	Farmer 14	9930000014	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.19	2026-02-09 10:16:49.679907	2026-03-04 03:39:58.436044	SOLD	\N	\N	\N	\N	\N
3e7b4f64-00f1-4851-855f-917b31a8079a	Farmer 229	9930000229	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-20 16:34:43.603495	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
171631a6-17f7-4da0-9ffa-022e65090d4a	Farmer 231	9930000231	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-20 14:08:31.834909	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
45c1774f-231b-478c-baf4-dbcadd1c8842	Farmer 233	9930000233	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-04 08:38:34.369375	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
a2dcf7c4-015a-48c9-95e9-42eabb46dce0	Farmer 234	9930000234	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-03 21:08:35.442651	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
73b706da-d24d-40b6-a8ab-3ae68f0197db	Farmer 235	9930000235	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-07 11:16:06.893524	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
5906e484-dc2c-40a4-a5fd-78a96d624758	Farmer 237	9930000237	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 07:09:29.326287	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
3359ab5c-18ee-4ff2-9135-307443962b15	Farmer 238	9930000238	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-16 10:21:32.26003	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
c2ae72d5-7dcb-4117-963b-5cbd42e7115a	Farmer 239	9930000239	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-12 09:40:14.002811	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
d9c2ecd7-dab6-4f26-888e-f86b3ca1a996	Farmer 240	9930000240	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-05 04:07:08.709973	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
1e415deb-e02e-450c-b59c-d5510b7d10f2	Farmer 241	9930000241	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-18 00:58:27.124489	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
59f6eb2b-0b68-4aac-b422-f6aa99511063	Farmer 243	9930000243	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-09 10:45:22.555597	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
9169d064-9ee0-475e-b5a8-43628cc5b276	Farmer 244	9930000244	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 06:11:28.798335	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
82b17bfd-5331-4427-9a8d-6f46f66c0f79	Farmer 245	9930000245	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-12 15:11:02.430739	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
72aa8647-d8a0-42da-b72e-dd75b0dbdd6c	Farmer 246	9930000246	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-02 08:25:11.970764	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
aff8ad21-0072-4494-9e40-c3bfc6d9a381	Farmer 247	9930000247	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 17:39:56.703014	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
b255a132-193b-4b06-a971-ffc5f2a3de3a	Farmer 248	9930000248	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-11 07:56:51.932758	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
cc0868cd-c3f8-45b2-bc6f-018865ff9f05	Farmer 250	9930000250	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-19 18:43:22.162077	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
9958a6b0-34e5-4425-95c1-86faa79bedf1	Farmer 253	9930000253	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-04 19:21:17.262676	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
4bd8c5ee-ff4a-4ef3-9a25-282372568fb7	Farmer 256	9930000256	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-02 19:32:38.003783	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
ae4c958a-09cb-4eb4-81a4-bdb93854438f	Farmer 258	9930000258	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-19 06:28:53.378299	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
cebac26f-be33-4f0f-9bf9-8dcd2ad88c23	Farmer 260	9930000260	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-18 08:07:30.489565	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
23ac8bc2-4322-4691-871e-ebd6cef7cfd3	Farmer 261	9930000261	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-13 00:27:06.530147	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
cf84a1f5-da53-41f7-a2bf-5ac4a6a217af	Farmer 262	9930000262	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 01:26:22.047356	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
2b9b37ba-db22-467d-8aa1-95e5fef0a136	Farmer 263	9930000263	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-18 21:05:42.09069	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
77cec52a-cca4-45f0-b4f2-358b043dc455	Farmer 264	9930000264	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-20 20:50:26.123133	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
fb84d073-8ee2-41e0-af48-b9df4e049c54	Farmer 265	9930000265	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-07 08:02:12.478004	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
43df7202-76dd-43dd-8421-536416cfcc6e	Farmer 266	9930000266	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-07 10:35:18.363164	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
6d112dff-82d3-4f62-990a-a43c87106bda	Farmer 267	9930000267	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-18 20:05:20.226182	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
2720b5cc-d674-4990-9ff5-f3d34e8aa299	Farmer 268	9930000268	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-14 10:14:27.841101	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
773d34d9-ba96-4f58-a182-c55b14156d77	Farmer 269	9930000269	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-12 06:54:36.397385	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
e4335811-ac4c-435b-b4cd-7059fd83ab13	Farmer 271	9930000271	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-20 02:01:08.942089	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
ac7040b7-fa97-4f9c-ac1d-6565122b2a73	Farmer 272	9930000272	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-10 20:25:11.38075	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
7a4b1ebf-965a-40f9-8067-30304992f585	Farmer 273	9930000273	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-04 01:05:04.067531	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
c1ad1b8e-5300-4d85-b677-679f8323feba	Farmer 274	9930000274	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-15 01:53:15.640309	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
efdf9962-e832-4084-9a07-b8f1137ecee6	Farmer 275	9930000275	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-19 03:41:52.618131	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
8b4a7c14-a1b6-467e-8d9f-66baf308a907	Farmer 276	9930000276	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-17 17:59:35.527096	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
d8838e09-aa10-4b61-83d3-58a2e8cd5176	Farmer 277	9930000277	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-10 17:08:16.470117	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
16cfdd72-3b1e-48c8-ad26-dcd971e33323	Farmer 279	9930000279	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-07 04:02:20.90662	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
7c1df37a-b098-4668-bd78-5d9c8f144783	Farmer 282	9930000282	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-06 19:32:57.434078	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
cbfd70fc-8d44-43ee-9fc9-759183c77094	Farmer 283	9930000283	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-03 21:58:43.31769	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
0dee1ed9-dd81-4a8f-8862-32d8f4429d87	Farmer 287	9930000287	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-03 00:16:36.4458	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
3694d418-e4b7-402d-8ddf-a83f268bf803	Farmer 289	9930000289	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-06 13:58:26.107951	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
5532ddfa-8584-4266-9b08-46a5f4dc520d	Farmer 291	9930000291	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 21:49:06.962212	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
c91cf12c-f551-4157-8c3a-41196785ded5	Farmer 292	9930000292	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-02 11:32:24.416297	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
52d22143-a4b0-41de-a2e2-487daa0e17f0	Farmer 294	9930000294	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-19 06:21:29.827155	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
74d794ae-39d8-4bdb-91c0-ee3c5784dd2b	Farmer 295	9930000295	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-19 02:21:16.071373	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
dee260ab-47dd-49a0-92b0-e1e57443e7f8	Farmer 296	9930000296	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-06 20:21:43.998827	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
1acd3425-e9c8-4f7c-882a-2b0402374727	Farmer 297	9930000297	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-18 11:32:56.082363	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
cb0a368c-f1c3-4af4-be3f-1e6799676994	Farmer 298	9930000298	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-11 23:40:08.64424	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
f8117829-8122-40bf-8985-f29cb0a0e1aa	Farmer 299	9930000299	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	0	\N	\N	\N	\N	\N	\N	2026-02-08 19:56:16.124268	2026-03-04 03:37:18.476492	ASSIGNED	\N	\N	\N	\N	\N
9d5092e0-8f2d-460a-b012-58f79ce3bfcc	Farmer 165	9930000165	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-02 21:57:26.064884	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
51b59706-d48e-4dcd-b502-ff57d67f129f	Farmer 166	9930000166	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-18 03:56:36.976946	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
bf342654-c4b1-459d-89cc-86e547fb0fa0	Farmer 167	9930000167	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-09 07:39:29.946868	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
89ccb6d7-4c6d-44ce-8504-e3752b6df937	Farmer 168	9930000168	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-21 08:17:30.835489	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
45ec03be-4edc-48a0-8c9d-d7c900968bd8	Farmer 169	9930000169	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-17 13:58:25.734745	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
b09e8b38-9b9f-48b5-ac08-77a19b8a0420	Farmer 171	9930000171	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-18 18:02:17.266775	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
705fa979-ccff-4768-a768-2f7868fa163b	Farmer 172	9930000172	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-20 18:03:14.898551	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
cf0d8fe7-e0a5-4fcf-8790-e991f7c67443	Farmer 173	9930000173	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-14 06:15:43.236229	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
8e4e0ff0-c56d-4e5a-8d89-0d814d8e4cb0	Farmer 174	9930000174	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-17 04:05:44.948121	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
0f059491-617c-4030-998a-3940b7ec9d6a	Farmer 175	9930000175	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-12 19:19:51.781067	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
3f6aa06a-b2b7-4827-9f73-05e26b7d0f75	Farmer 178	9930000178	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-04 12:43:50.265958	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
96b121fa-ca41-4d40-9ede-4f61c93a0f7a	Farmer 180	9930000180	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 09:36:04.528917	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
b9fce5e9-6612-4dd6-8ad4-958467abbd3c	Farmer 182	9930000182	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-06 11:04:18.053159	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
685f2a15-c3f0-4d4e-88c1-0c6ad3fe93b5	Farmer 183	9930000183	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-08 12:36:30.517772	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
53c52bf7-5639-4a39-b576-9c491a83c66b	Farmer 184	9930000184	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-19 13:43:18.500954	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
0104d2f4-e14c-4def-9a7e-271cd57f467c	Farmer 185	9930000185	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-04 14:00:17.272159	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
3223c9dd-6ee5-4b75-9ae3-fbd345946168	Farmer 186	9930000186	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-18 02:32:55.946258	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
284bba06-884d-4e4f-8fc0-fcc47b80fbe2	Farmer 187	9930000187	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-12 07:07:18.205232	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
ff2a9ff2-e458-4226-97c8-bf423d0e459d	Farmer 188	9930000188	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 00:38:36.048143	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
098bf076-4f84-4c19-aa37-a34f24c49f56	Farmer 189	9930000189	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-18 20:18:54.703532	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
eb7d0409-fa73-4cf5-beaa-666e2fe09d4d	Farmer 190	9930000190	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-14 21:39:50.774666	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
c37afb7d-8790-471b-bc57-928bf7846302	Farmer 191	9930000191	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 02:17:59.422591	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
4d162726-b1f7-46fc-9ddc-bd4d2b6162f0	Farmer 192	9930000192	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-12 11:06:06.625425	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
7db640b4-db6e-40b3-9b42-cc682392002d	Farmer 193	9930000193	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-20 03:03:12.157205	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
0759fe6a-506c-4add-936d-c95dc0ca57ad	Farmer 194	9930000194	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-13 19:14:37.544088	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
e8f5178c-974f-4e8d-ab24-2fcb019d74e8	Farmer 195	9930000195	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 17:22:28.577467	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
eb0b7df0-d9e1-4173-ba58-063691eea96a	Farmer 197	9930000197	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-02 16:54:39.340282	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
9fb38331-2f8f-4985-a4a4-02c000477c8c	Farmer 199	9930000199	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 18:32:27.968312	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
c7c274be-9324-46f0-a68d-192686c6de33	Farmer 200	9930000200	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-05 13:10:31.904009	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
41930bf4-ed80-4fbe-afa7-5a5422e5d681	Farmer 201	9930000201	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-14 17:13:17.068864	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
75a70e1a-f98a-49e2-96f0-e392efda9cd0	Farmer 202	9930000202	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-07 12:19:09.210085	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
59708ef5-adbc-446f-873c-f622e066658f	Farmer 203	9930000203	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-05 20:59:58.640164	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
7da382a7-77b2-48a8-b2fb-fc831d2032a7	Farmer 204	9930000204	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-14 22:16:43.776296	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
d63321c7-71c0-4257-932f-b1a5769f9a4e	Farmer 206	9930000206	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-05 23:11:34.490295	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
86ac4178-8124-48c7-b686-31e9ad9c5a61	Farmer 208	9930000208	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-17 12:24:51.474806	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
a045c066-c405-4dbf-a9a4-a96f9a93f3d1	Farmer 209	9930000209	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-06 09:51:03.23457	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
e500bd9c-0267-421c-876e-142062bc1853	Farmer 210	9930000210	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-08 02:46:27.810676	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
30261060-9c18-4aea-85a3-7bf2c8e030f2	Farmer 211	9930000211	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-16 20:18:26.763257	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
f480a987-0320-4646-8d08-d37c4f3a4ecc	Farmer 214	9930000214	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-18 20:37:00.263444	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
eee9fdc9-5c86-4926-bd3b-9f8c6fe9c9e6	Farmer 215	9930000215	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-03 19:07:50.166963	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
980df7e7-c4de-4c3a-b3f0-7fa2285eb40d	Farmer 217	9930000217	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-06 11:21:57.743731	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
bbea5dfe-06ae-4260-abeb-4a0ad41a46f6	Farmer 218	9930000218	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-20 19:44:41.456026	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
1f485969-126b-42e2-a2af-a2b005b3e3e9	Farmer 219	9930000219	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-09 16:54:35.986286	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
b77fbb0c-9b52-42d1-a120-cd77c0f18f06	Farmer 221	9930000221	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-04 20:06:43.490225	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
3a0a42cd-884c-46fd-a281-a8bac4077bbc	Farmer 222	9930000222	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-15 08:16:11.515051	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
969e4d23-ea85-4095-9c69-0ab5904adc89	Farmer 223	9930000223	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-05 05:56:03.941097	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
d78274e5-653e-4a59-b5f9-3374793859f3	Farmer 224	9930000224	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-06 17:39:18.437252	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
53b3a056-c33f-499e-be1a-4d5e2c3403e6	Farmer 225	9930000225	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-19 06:28:27.290979	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
5353cd21-78d6-458b-b712-5533da692136	Farmer 226	9930000226	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-03 05:45:49.955475	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
fed99d3d-c03e-4ec7-8506-55db0e659c70	Farmer 227	9930000227	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	\N	\N	2026-02-21 01:29:29.774283	2026-03-04 03:37:18.490045	CONTACTED	\N	\N	\N	\N	\N
531cdd4f-c162-4dcd-b835-151ca9108f67	Farmer 120	9930000120	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.15	2026-02-21 13:40:25.7682	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
87b5c971-d56c-4841-8d97-71727fa4ff3a	Farmer 121	9930000121	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.90	2026-02-05 18:21:36.087006	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
db9f26d3-7f3c-4d94-ae27-b5509b898b18	Farmer 122	9930000122	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.16	2026-02-19 02:36:06.603493	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
0d2299a4-85c2-4879-b2a8-f660e8029ca9	Farmer 124	9930000124	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.92	2026-02-05 17:03:22.917078	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
0285ab05-f8a0-40bc-8afc-a62c809390a2	Farmer 125	9930000125	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.14	2026-02-02 22:51:52.878446	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
23a242ab-a89d-4300-9e70-65b8c90e3e15	Farmer 126	9930000126	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.46	2026-02-02 14:46:57.735236	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
27f7ef14-b75a-424b-bfbe-a04c5ef17b23	Farmer 128	9930000128	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.56	2026-02-14 10:19:06.169951	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
d5016148-0706-47bf-80b7-7ebe9cf743e8	Farmer 130	9930000130	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.58	2026-02-15 05:23:30.101914	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
cc91dbf5-a3f1-4e18-850a-398a4019b2f0	Farmer 131	9930000131	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.20	2026-02-09 15:49:01.552158	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
48e66621-df13-4329-948a-866d11f8ebcb	Farmer 132	9930000132	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.48	2026-02-04 18:58:43.774381	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
2d150789-f709-49b1-b9f7-9e9e3adf9ef9	Farmer 133	9930000133	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.62	2026-02-07 01:45:13.921194	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
3ffb2994-71a5-4887-a02e-f61b7478e970	Farmer 134	9930000134	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.97	2026-02-18 09:16:57.44759	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
3b895f2c-cb89-412c-9b92-a08e68b28c43	Farmer 135	9930000135	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.24	2026-02-06 12:46:26.244796	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
9fd8e422-6838-4680-892d-63685ccec416	Farmer 136	9930000136	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.34	2026-02-03 02:50:58.04814	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
5d7268c0-706c-4852-86f4-f63df4a9b162	Farmer 139	9930000139	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.16	2026-02-17 23:49:01.712396	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	Farmer 145	9930000145	Village 5	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.76	2026-02-09 22:39:25.105599	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
e07a60d2-437e-4a94-8858-fa79185a0cf4	Farmer 146	9930000146	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	3.96	2026-02-07 18:45:02.791734	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
fe0c0c98-b7b8-4870-9de2-3aff7306dddf	Farmer 147	9930000147	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.32	2026-02-17 11:17:37.823691	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
12c73d29-ff5f-4112-a842-48f1caa975a3	Farmer 148	9930000148	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.96	2026-02-10 06:05:33.849398	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	Farmer 149	9930000149	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.72	2026-02-14 23:19:07.795342	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
d19037dd-2c6f-4cb7-9054-9405ea57feda	Farmer 152	9930000152	Village 2	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.03	2026-02-10 23:30:51.594367	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
68c21441-cf92-4da9-b6ae-10bf6067dfcd	Farmer 153	9930000153	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.86	2026-02-11 13:28:03.230219	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
5e7ccade-69e5-4d15-9196-651154d1c573	Farmer 156	9930000156	Village 6	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.87	2026-02-04 05:52:25.925065	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
3b76644e-54a3-47aa-a273-83edb9a89e68	Farmer 157	9930000157	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.47	2026-02-02 21:11:20.080533	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
72fd3fef-00c3-490b-b091-66a346e978d3	Farmer 159	9930000159	Village 9	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.74	2026-02-20 09:46:28.217096	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
92d0e9e1-c713-460b-8c23-6ff5a58e0d90	Farmer 160	9930000160	Village 0	Taluka 0	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	1.36	2026-02-05 22:33:27.409813	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
c08ceff3-c2ff-4f70-ab1e-3b91220383cb	Farmer 161	9930000161	Village 1	Taluka 1	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	2.71	2026-02-19 20:34:58.578735	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
c485653c-c417-4422-873e-20882a65ed85	Farmer 163	9930000163	Village 3	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.76	2026-02-10 16:18:42.465258	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
f54e22f2-ad4d-42a9-bfac-e44426d1c863	Farmer 164	9930000164	Village 4	Taluka 4	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.39	2026-02-15 02:40:07.893667	2026-03-04 03:37:18.502913	VISIT_REQUESTED	\N	\N	\N	\N	\N
583b01c8-510f-4196-ae00-674098ae9408	Farmer 107	9930000107	Village 7	Taluka 2	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	5.28	2026-02-10 06:34:40.905997	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
336cd48d-1851-47d6-83df-d835dc1836fb	Farmer 108	9930000108	Village 8	Taluka 3	Sabarkantha	Gujarat	8a46eba7-8673-402d-8e92-db50d976e9ff	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	2026-03-04 03:37:18.490045	\N	\N	\N	Wheat	4.40	2026-02-15 04:20:48.714124	2026-03-04 03:39:53.265146	VISIT_COMPLETED	\N	\N	\N	\N	\N
\.


--
-- Data for Name: points; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.points (id, user_id, lead_id, points, reason, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, username, password_hash, role, is_active, phone, email, created_at, updated_at) FROM stdin;
5431c6ad-01d3-408e-b60b-1c55fb6eb854	System Admin	admin	$2b$10$rKvV1QO5z4tZyLqGx8c.LOjKGKJMJ2YyP7aH6HZs9jqF3WZj9fYJm	ADMIN	t	\N	\N	2026-02-22 23:54:03.632334	2026-02-22 23:54:03.632334
ae390c91-2f8c-4745-beba-74768edcf05c	Admin User	admin1	hashed_password_here	ADMIN	t	\N	\N	2026-02-22 23:58:07.59179	2026-02-22 23:58:07.59179
12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	Test Telecaller	testTelecaller	$2b$10$sZGb/5ce1vZL2gyGUZIEbujuH6hinXdCbvdC.ygyGru91IQNJAzZy	TELECALLER	t	9000000001	telecaller@test.com	2026-03-01 11:53:12.432345	2026-03-01 12:01:09.849832
2c11ff4d-28d0-40c0-886d-bcd4e424e1fc	Test Field Manager	testFieldManager	$2b$10$0rrFOuk1LQW92EI75NBvKef5WDW0Dbqyv98KRpEISY6QF2DtIuPZC	FIELD_MANAGER	t	9000000002	fieldmanager@test.com	2026-03-01 11:53:12.432345	2026-03-01 12:01:09.851068
e3f36fbe-7b95-4d98-ac18-8f86bb37350d	Bull Admin	admin@bull	$2b$10$A5imiYP6lBJGQ45zZbr...2ts1bCwNzX5sVSVVRCDiw79RoXZJ91.	ADMIN	t	\N	\N	2026-03-01 12:14:25.772493	2026-03-01 12:14:25.772493
fb602605-9400-4a86-8018-b2756a6b05a9	Telecaller One	tele1	$2b$10$GRTNtCGIn2rL1Qn2lbxive8Guigv1m/5X110eKjNjuvEbmVEwJ3au	TELECALLER	t	\N	\N	2026-03-01 12:15:28.082244	2026-03-01 12:15:28.082244
0c2636a2-63cb-4c52-a559-fc621ba69aad	New Manager	manager1	$2b$10$sZGb/5ce1vZL2gyGUZIEbujuH6hinXdCbvdC.ygyGru91IQNJAzZy	MANAGER	t	\N	\N	2026-03-01 12:40:01.042927	2026-03-01 12:40:01.042927
bef5136d-306e-4c89-9bf2-39f8c8101e64	Telecaller Test	telecaller56	$2b$10$4DK6BT75QvjGWFcaF1plPuXm.iYdCzJb2fSfmW2mE3IAsF.27gZIO	TELECALLER	t	\N	\N	2026-03-03 18:33:12.331508	2026-03-03 18:33:12.331508
3670724e-802e-41b1-baf7-1c4d2f6aaadf	Manager 56	manager56	$2b$10$JbJABhpi4kOK4.DSPnR5qO.GuVKq4Q3q6Vqv6.WRVrOr3omSm80jS	MANAGER	t	\N	\N	2026-03-03 20:40:05.983787	2026-03-03 21:15:40.726407
7185dc86-9eb2-4b39-8b3e-b67d81aa082b	Dhruv Patel	dhruv.patel	hashed_password_123	TELECALLER	t	9876501234	dhruv.patel@bullconnect.in	2026-03-03 22:49:19.491051	2026-03-03 22:49:19.491051
cfbbf9ac-3bd4-4ed7-8dd9-187cd9df5432	Krunal Shah	krunal.shah	hashed_password_123	TELECALLER	t	9898012345	krunal.shah@bullconnect.in	2026-03-03 22:49:19.491051	2026-03-03 22:49:19.491051
f3c609d9-e7ab-445b-be3e-a31a4b840a08	Bhavika Modi	bhavika.modi	hashed_password_123	TELECALLER	t	9909012345	bhavika.modi@bullconnect.in	2026-03-03 22:49:19.491051	2026-03-03 22:49:19.491051
88260840-51ac-46d3-8d9f-38720db77242	Admin User	admin56	$2b$10$STWvJf.baxzLhf/60.kq4OrgduqEQRuneXE78TNwPMvCFmNNCSsca	ADMIN	t	9876501001	admin56@bull.com	2026-03-03 23:57:13.945033	2026-03-03 23:57:13.945033
01bcfba6-36de-4472-a0e2-11b57d3ae679	Ground Manager	groundManager56	$2b$10$STWvJf.baxzLhf/60.kq4OrgduqEQRuneXE78TNwPMvCFmNNCSsca	FIELD_MANAGER	t	9876501002	ground56@bull.com	2026-03-03 23:57:13.945033	2026-03-03 23:57:13.945033
0acde006-f8c3-404e-9370-796fc8d2957e	Field Executive	fieldExe56	$2b$10$STWvJf.baxzLhf/60.kq4OrgduqEQRuneXE78TNwPMvCFmNNCSsca	FIELD_EXEC	t	9876501003	field56@bull.com	2026-03-03 23:57:13.945033	2026-03-03 23:57:13.945033
8922127a-452d-4b67-ac08-35dbd00a854c	Jinal Desai	jinal.desai	$2b$10$STWvJf.baxzLhf/60.kq4OrgduqEQRuneXE78TNwPMvCFmNNCSsca	TELECALLER	t	9825011122	jinal.desai@bullconnect.in	2026-03-03 22:49:19.491051	2026-03-04 00:08:45.080429
94fd2aca-2ce5-4614-ab03-d1885a22caba	Test Field Exec	testFieldExec	$2b$10$STWvJf.baxzLhf/60.kq4OrgduqEQRuneXE78TNwPMvCFmNNCSsca	FIELD_EXEC	t	9000000003	fieldexec@test.com	2026-03-01 11:53:12.432345	2026-03-04 01:14:00.807336
f841d63d-dfc9-48d5-8d65-aabb3a7449ae	System Admin	admin_seed	dummyhash	ADMIN	t	\N	\N	2026-03-04 03:37:18.435709	2026-03-04 03:37:18.435709
862b4973-8661-41e2-8225-91edb154b4d0	Telecaller 1	tele_1	dummyhash	TELECALLER	t	9810000001	\N	2026-03-04 03:37:18.442781	2026-03-04 03:37:18.442781
02bcaf9f-aae0-4e13-8834-4d0d4b5fdab2	Telecaller 2	tele_2	dummyhash	TELECALLER	t	9810000002	\N	2026-03-04 03:37:18.442781	2026-03-04 03:37:18.442781
50b0b105-d666-4cba-984b-ba9333fc8c84	Telecaller 3	tele_3	dummyhash	TELECALLER	t	9810000003	\N	2026-03-04 03:37:18.442781	2026-03-04 03:37:18.442781
ee167d8e-4ff9-4cc9-a41e-d73b2e403cf9	Telecaller 4	tele_4	dummyhash	TELECALLER	t	9810000004	\N	2026-03-04 03:37:18.442781	2026-03-04 03:37:18.442781
eb8554fb-8389-4c78-be7c-c45126111eac	Telecaller 5	tele_5	dummyhash	TELECALLER	t	9810000005	\N	2026-03-04 03:37:18.442781	2026-03-04 03:37:18.442781
61fee8fd-80c2-41c3-be25-d476d0a38e24	Field Exec 1	field_1	dummyhash	FIELD_EXEC	t	9720000001	\N	2026-03-04 03:37:18.447749	2026-03-04 03:37:18.447749
9172b239-eb2c-4d07-a518-26f31d09b6bb	Field Exec 2	field_2	dummyhash	FIELD_EXEC	t	9720000002	\N	2026-03-04 03:37:18.447749	2026-03-04 03:37:18.447749
418ef4e2-fc2a-4fd9-b1de-a384c9578385	Field Exec 3	field_3	dummyhash	FIELD_EXEC	t	9720000003	\N	2026-03-04 03:37:18.447749	2026-03-04 03:37:18.447749
\.


--
-- Data for Name: visit_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_photos (id, visit_id, photo_url, photo_type, uploaded_at) FROM stdin;
\.


--
-- Data for Name: visit_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_requests (id, lead_id, requested_by, priority, notes, status, created_at, updated_at) FROM stdin;
a5018aa7-b37e-4b62-8195-1b3317e44a8d	1eafc6c6-5af9-4b03-82c0-17503007149a	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	1	UNKNOWN	PENDING	2026-03-01 12:58:52.475972	2026-03-01 12:58:52.475972
120f3b2a-c89f-45cd-801f-d7116aeee256	2408cace-27a2-497b-95b2-51d3f1e379d0	bef5136d-306e-4c89-9bf2-39f8c8101e64	1	Farmer interested	PENDING	2026-03-03 21:44:33.191601	2026-03-03 21:44:33.191601
44c567a4-a8bb-4b77-93c5-9ef07cfb3760	675904cb-2e3f-4f18-994f-4bc1d061c9ed	bef5136d-306e-4c89-9bf2-39f8c8101e64	1	Farmer ready for site visit	PENDING	2026-03-03 23:06:17.412945	2026-03-03 23:06:17.412945
d8097e37-b763-43f7-ba3f-8f41ca7a96b7	fc5a4620-4644-4aa4-a559-dfbe20334c97	8922127a-452d-4b67-ac08-35dbd00a854c	1	Wheat	PENDING	2026-03-04 00:18:40.022062	2026-03-04 00:18:40.022062
c9ff98b8-4ee4-4eb6-8862-c5c14ec90523	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	bef5136d-306e-4c89-9bf2-39f8c8101e64	1	Cotton	PENDING	2026-03-04 02:08:09.215657	2026-03-04 02:08:09.215657
d1902249-aeb5-4042-9cb5-fd422ecdc933	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	bef5136d-306e-4c89-9bf2-39f8c8101e64	1	Cotton	PENDING	2026-03-04 02:22:55.342844	2026-03-04 02:22:55.342844
e7aa1b95-600d-4ed9-afa7-a5837d58c724	1eafc6c6-5af9-4b03-82c0-17503007149a	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
5643ef7c-890d-46da-9ff8-ef4fd17994a2	2408cace-27a2-497b-95b2-51d3f1e379d0	12c5bc8d-c1e8-42bb-a7d9-48806237ef2a	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
56e371b1-f589-47b3-9758-e89a1565feeb	fc5a4620-4644-4aa4-a559-dfbe20334c97	8922127a-452d-4b67-ac08-35dbd00a854c	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2b2e8138-4de2-424f-b60f-ac8dbceacc9a	d7e7e52b-ec77-4494-80dd-c55ed36816f7	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
68798ffd-83c0-404f-af33-27d7fda82511	6333de00-b21d-4bab-8ce0-19921dadc2fa	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2275c219-3876-4c1b-bc01-68b01820974c	1a032539-9a4a-4805-8b07-6ebd6aceec91	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
41db8667-8aaa-4a57-b1f0-4d4a57b449a6	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
a7537ae7-13c3-4b05-af07-1ad6c48df046	ecf3c70a-ef04-4442-b913-f70e4dee1b17	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b7f1310c-c6f1-4818-b15a-d9769e442f27	563d6af6-4c01-40c8-99d3-1e65aafe27cc	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
5df58748-b29b-4766-b071-bfe4f51ec23f	31e33e6a-99d0-4004-ac72-2265d9f5d012	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
3ecb5cc7-449b-4c59-b719-0b83c3a1efce	a3b76924-9822-4e28-8aab-c7fb81daba01	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
aba5626d-3dee-4d79-9dbd-4d3735416175	da269c9d-031c-48c9-898a-e68d94a8d5b6	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
5bd89560-4eed-4f71-b50d-f425ed579e3e	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0ea7b880-d9ca-4f10-a84c-a798f1bff605	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
d968e775-9463-4dfb-8e7f-772dfbfbf1ca	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
98ec0e83-7684-4202-b7b5-9e26fa34d060	8463c290-4d93-4e90-9d3b-c0a798eff6a3	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e5251e1c-32f7-4910-be76-5a7b597081c0	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
25dfe824-d9fd-4e37-8ce8-3413e9446532	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b848585d-e988-4b05-926e-decb6023b845	667ca3a6-212d-4669-a4da-50224377399e	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0f8ae21c-859a-4944-a5c9-fca4a6c20f4d	ea2f00b2-bf51-42d0-8407-2981cd02f964	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
ad022d65-86d4-48db-9a18-88beda8c5920	2f2ba06d-9233-422f-853b-20ed45f6bebe	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0f4f882e-5992-4085-b4e2-18b943b8f914	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
54e45889-0c2d-4aff-9e04-a18d18ef13da	9070b23b-8612-4242-acb4-05f0472e168b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
46650b89-7d1b-41bd-a136-6d35e22ee17e	ed44058a-9772-481c-a9b7-eee3af0380f6	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
ee8ee8cb-6712-4425-b152-57dba7f88121	30cb7537-0817-423b-8e57-132cb8514e83	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
20104f9f-1e6e-486d-a99e-f4637b21ba02	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
94426dfe-afc4-4f54-be6d-c4c7bcfa7924	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e9afc1cb-c9dc-49ff-99f7-7562eb48fee2	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
8bf28fcc-cf73-4e1c-9e4c-87cdddd99806	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
a0507136-9bbc-4724-867c-c587c8225e36	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
a896943d-8ae2-45df-ac9a-a84806a13c87	c5739442-e088-4082-8ba9-369309ce896b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
986cc265-b380-4d99-a607-781c9aa0f78a	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
917cc413-45b4-4b5f-94a0-9e9b6f4211ad	96ea73d5-f80d-4a76-803f-44ae4acbbf06	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
54bd07fa-a411-41bc-a59a-6b7a2ab25f20	5f209a49-159c-4798-b32d-62b9afe33eb0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0fc9a59f-4104-40ee-8283-6609a4556969	117c1d82-6651-48ba-9ae0-8e37b3020062	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
09b74736-885e-40c8-8637-86979df7baf8	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
84b0231c-6504-4a64-be60-d205f1d55dc3	c52c9aa5-f227-4631-b43a-19ffdfd0917c	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b4a54dff-14ec-4ad9-af8c-c43106453ccf	9b763dda-f572-46ae-b140-01d7ed0a39a0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e6c350c2-cb9c-474d-87d0-ac92afc6a678	25774ac1-fd82-4f3a-b6c2-df0beceef04d	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
d48b676a-34e7-4bf0-95dd-ed4234cea1b3	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
510cee12-ea31-48ba-a9b6-4d57361879d3	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
37035696-793f-4370-8156-0de6587fd533	377cadec-13ac-483f-b592-f8c0c65a6913	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
53dcc738-5fad-4bde-a52c-b4cba775de5b	7a7bba31-0a14-44d6-b7ce-4d4626be3957	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2fdec3f2-eeb7-493a-8af0-1f9f8b98efe2	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
aafc05b7-88e4-4c35-bb4f-783c23a70b1b	e5491fc8-112e-41c8-96c2-091f40c56cfb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
c6d03410-c436-421b-98b5-417890fac522	1f4e7b7e-54b8-42aa-95bc-6e4916258435	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
fe6ba3ac-e0a3-4f4d-aeab-9df32fd4f690	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2f7165fd-ad9f-4652-8a5c-d90bfa3040fd	8ce33615-a30a-415f-9a37-ef685af1fded	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2d526f34-11c6-45c5-8064-eb4e9fc3d674	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
77d3e532-2ce6-4711-b185-f6fb67e5120f	95d0cf64-841f-43a7-a738-ac2f78e5716b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
ffdcbbf9-1eb3-419a-9112-6076000d25fb	d5e96494-d4f4-4529-8e7b-3664920dbbda	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
8713491b-bb17-4928-a2a2-c053c41ad15c	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b031db71-8edb-4b95-92df-f7f9c550841f	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
f0b08cfe-b4f0-47de-9c01-f64b607803a5	56822283-8d34-4d84-9ceb-6281acf28d5b	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
ab85f569-8177-4799-8ba9-0f3728ee4f73	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2d04707f-1c49-44e5-a748-15a77dbc9918	45b681df-e2b3-4a09-8ae0-16684d33b588	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
113e65f6-73b2-4985-9abf-7f55bd2e1141	f03e7a35-00c5-496d-8388-84971fc67c2c	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b628a98f-87ae-42c8-8b84-bf8a8aa655ad	8835717d-c031-4d9a-9af3-20f5b18720d4	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e8fee11f-bafb-4c4e-aa55-e37b7dc61ca3	53a5203c-e09f-492a-b59b-5d50d8f1aea1	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
98deb313-2562-4f26-83e3-f6bdb57070d6	b9baa47f-3a0a-4120-88e8-cba154fde4f6	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
490921e0-0b6f-4785-9d2b-3ec90fd4acba	af260e05-2819-44b4-8836-06e474b70647	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
87550c63-3821-4214-b19a-f019c18361dc	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
378f6a08-e2d1-4b04-a701-39177665822a	b89dd81c-0b41-4c3d-aee1-28340321c151	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
9cf1d33f-17fe-4517-9e32-1c37079a5900	3df5d081-ebb8-4110-919f-f496340287b5	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0b5c7247-ef5b-41da-9328-77ef5edb11c4	f80207a8-caaa-4f75-b352-eb504ae2cf31	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
91267bb7-77fa-4f3e-b0ed-a1ec81374105	583b01c8-510f-4196-ae00-674098ae9408	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
b94ab3e4-563a-4e93-a07c-5d8885287275	336cd48d-1851-47d6-83df-d835dc1836fb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
f0ec6d91-2376-4a66-aaf9-79d56249bd0a	cf521eec-7a13-4e1f-af64-b4575b75dc02	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
61738fdb-fc5b-4733-a06a-5eff06c5e766	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
a8436466-7b06-49fc-b10c-1a4fff0f10a0	01b11d7d-39c4-4caa-8c7b-eee772073f4f	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
54859b4b-298b-43c0-947f-9ff2b784caf2	f08f63b0-e11c-452a-8495-3daa7a300352	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2019a02d-755a-4ff1-a475-69e91c35ff6c	f0034829-f39c-4ce2-886c-6c01c5f8e444	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
cb233dff-b245-41e1-94fb-776ef36b7cae	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e197cfbe-660b-4445-8262-b7a3ea9e78f9	c977629e-3832-4007-a4b6-85d3a6078cab	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
54ac3c07-3371-41ff-b2c0-d8d4277eb8e4	531cdd4f-c162-4dcd-b835-151ca9108f67	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
6c116ef5-7daa-46f1-9450-14406cfbf764	87b5c971-d56c-4841-8d97-71727fa4ff3a	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
33501753-3fc9-4306-aa43-b7ac522f86f3	db9f26d3-7f3c-4d94-ae27-b5509b898b18	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
936891db-c3fa-494b-8d56-e330206224cd	0d2299a4-85c2-4879-b2a8-f660e8029ca9	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
d2fd79ad-afd3-49c5-b5b2-29f8116c802b	0285ab05-f8a0-40bc-8afc-a62c809390a2	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
e74399a7-0277-46b9-864a-5ee1f80459fe	23a242ab-a89d-4300-9e70-65b8c90e3e15	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
aa08446c-2188-4af1-88ab-656b2d592ca2	27f7ef14-b75a-424b-bfbe-a04c5ef17b23	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
323ef419-99e3-4542-a573-bc85cdc915a5	d5016148-0706-47bf-80b7-7ebe9cf743e8	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
11bd9a1f-a606-41a9-ba21-a99adc444234	cc91dbf5-a3f1-4e18-850a-398a4019b2f0	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
5a031914-5867-44d2-ab1c-5580719b0dbb	48e66621-df13-4329-948a-866d11f8ebcb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
3bdd53c6-6123-445e-ab84-6943e0f472ae	2d150789-f709-49b1-b9f7-9e9e3adf9ef9	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
1abc934e-2864-40b6-bbf0-56eaf1da6729	3ffb2994-71a5-4887-a02e-f61b7478e970	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
d833b4c7-3ca6-4870-ad5f-9c2ff75886cc	3b895f2c-cb89-412c-9b92-a08e68b28c43	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
d7db6d49-492c-40bf-b5f5-4cafd0eed0bd	9fd8e422-6838-4680-892d-63685ccec416	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
7b3fb476-a3e3-4f2a-8897-9e11be210898	5d7268c0-706c-4852-86f4-f63df4a9b162	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
efcd705f-ef17-4e6c-82e7-44aef849e53d	5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
3c1b6026-0ad6-45db-977e-3ec4045ac504	e07a60d2-437e-4a94-8858-fa79185a0cf4	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
81b78445-20e7-4d10-a21e-058152b211b1	fe0c0c98-b7b8-4870-9de2-3aff7306dddf	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
2966110f-5f59-4df8-b72a-59990553c45a	12c73d29-ff5f-4112-a842-48f1caa975a3	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
38eccaff-5d76-4957-99a1-f7e465981e7c	3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
6fe6aadc-a667-4070-9169-990d44dd9d8e	d19037dd-2c6f-4cb7-9054-9405ea57feda	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
25847815-12ab-48da-bb6c-fdfe716cce56	68c21441-cf92-4da9-b6ae-10bf6067dfcd	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
975e0d76-b2ef-4cba-a75d-dd06291a979b	5e7ccade-69e5-4d15-9196-651154d1c573	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
29a81920-6040-4571-b504-adf6ad955f68	3b76644e-54a3-47aa-a273-83edb9a89e68	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
645fa349-a454-4f3b-ae46-162f27c122c6	72fd3fef-00c3-490b-b091-66a346e978d3	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
6eb32ee1-fdc4-4756-92fe-d2938f925e7c	92d0e9e1-c713-460b-8c23-6ff5a58e0d90	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
9a9ede2c-db78-4288-837e-3e5d48a3edea	c08ceff3-c2ff-4f70-ab1e-3b91220383cb	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
0ebd5aef-fcf4-4cf7-ba05-2dc51a681a67	c485653c-c417-4422-873e-20882a65ed85	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
96a78d61-d455-40e2-8d77-13bb25f5e957	f54e22f2-ad4d-42a9-bfac-e44426d1c863	7185dc86-9eb2-4b39-8b3e-b67d81aa082b	1	Auto seeded visit request	PENDING	2026-03-04 03:37:18.512076	2026-03-04 03:37:18.512076
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, visit_request_id, lead_id, field_exec_id, assigned_by, scheduled_at, started_at, completed_at, start_lat, start_lng, end_lat, end_lng, status, outcome, outcome_notes, created_at, updated_at) FROM stdin;
4500e535-fc77-4f14-9d58-23ed1366636d	d1902249-aeb5-4042-9cb5-fd422ecdc933	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	94fd2aca-2ce5-4614-ab03-d1885a22caba	01bcfba6-36de-4472-a0e2-11b57d3ae679	\N	\N	2026-03-04 02:29:15.045288	\N	\N	\N	\N	COMPLETED	SOLD	site_photo_001.jpg	2026-03-04 02:28:17.623582	2026-03-04 02:29:15.045288
08a7345c-1d80-43b1-9a2e-3ca25f308536	54ac3c07-3371-41ff-b2c0-d8d4277eb8e4	531cdd4f-c162-4dcd-b835-151ca9108f67	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
9e486fff-317e-4016-be96-9ae423b54c5e	6c116ef5-7daa-46f1-9450-14406cfbf764	87b5c971-d56c-4841-8d97-71727fa4ff3a	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
d7fd0637-f806-43ed-ba71-029fb12fbeb4	33501753-3fc9-4306-aa43-b7ac522f86f3	db9f26d3-7f3c-4d94-ae27-b5509b898b18	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
228a0b83-8229-4366-82d9-0b4d14167f0f	936891db-c3fa-494b-8d56-e330206224cd	0d2299a4-85c2-4879-b2a8-f660e8029ca9	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3b3f236c-93cb-483f-9c9d-abad4ec62ef1	d2fd79ad-afd3-49c5-b5b2-29f8116c802b	0285ab05-f8a0-40bc-8afc-a62c809390a2	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
a39c9e2e-1bca-4ec7-8d77-02255c835a80	e74399a7-0277-46b9-864a-5ee1f80459fe	23a242ab-a89d-4300-9e70-65b8c90e3e15	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
85884e2a-4262-4a63-bc1e-70b4697855aa	aa08446c-2188-4af1-88ab-656b2d592ca2	27f7ef14-b75a-424b-bfbe-a04c5ef17b23	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
76ea13bc-3e86-4a9a-99f0-072deb3b7166	323ef419-99e3-4542-a573-bc85cdc915a5	d5016148-0706-47bf-80b7-7ebe9cf743e8	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
f59b1171-de4e-4767-b325-3766e77adf80	11bd9a1f-a606-41a9-ba21-a99adc444234	cc91dbf5-a3f1-4e18-850a-398a4019b2f0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
712690b0-6c5e-449f-bbaf-7e32077a4715	5a031914-5867-44d2-ab1c-5580719b0dbb	48e66621-df13-4329-948a-866d11f8ebcb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
1d597491-b40b-4a52-a384-cf700f608041	3bdd53c6-6123-445e-ab84-6943e0f472ae	2d150789-f709-49b1-b9f7-9e9e3adf9ef9	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0c7f58de-6942-41c3-b41b-83c91aff04ba	1abc934e-2864-40b6-bbf0-56eaf1da6729	3ffb2994-71a5-4887-a02e-f61b7478e970	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
4a85582b-3596-47de-9b45-342e77401975	d833b4c7-3ca6-4870-ad5f-9c2ff75886cc	3b895f2c-cb89-412c-9b92-a08e68b28c43	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
91c2ad6b-b63d-4d34-8f2c-dd573bcdd620	d7db6d49-492c-40bf-b5f5-4cafd0eed0bd	9fd8e422-6838-4680-892d-63685ccec416	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
bf8ac67b-047a-4174-8e3d-f18b334509a0	7b3fb476-a3e3-4f2a-8897-9e11be210898	5d7268c0-706c-4852-86f4-f63df4a9b162	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
e633add7-a9df-4b73-ae76-d780301b3059	efcd705f-ef17-4e6c-82e7-44aef849e53d	5fcfa6a7-79a5-4827-86ab-26b2dde49dc3	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
498272b4-4cd9-4398-8b0e-adbe3e8c665a	3c1b6026-0ad6-45db-977e-3ec4045ac504	e07a60d2-437e-4a94-8858-fa79185a0cf4	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
fcf93e54-dbed-4324-9e5b-4e3ecafe8e06	81b78445-20e7-4d10-a21e-058152b211b1	fe0c0c98-b7b8-4870-9de2-3aff7306dddf	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
e573555a-c936-4de8-9997-6fa6173f5a91	2966110f-5f59-4df8-b72a-59990553c45a	12c73d29-ff5f-4112-a842-48f1caa975a3	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
1e46e704-72ba-40a1-be9a-33c43ea415d5	38eccaff-5d76-4957-99a1-f7e465981e7c	3dd4a3aa-50c5-4aa7-b749-fae690c3eb56	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
c25a1429-58d8-4452-88b8-2954f355a134	6fe6aadc-a667-4070-9169-990d44dd9d8e	d19037dd-2c6f-4cb7-9054-9405ea57feda	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
05225545-ee50-4b5d-af97-3e5571e52bfa	25847815-12ab-48da-bb6c-fdfe716cce56	68c21441-cf92-4da9-b6ae-10bf6067dfcd	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
aede7798-4764-4331-aa71-4a76085b6e27	975e0d76-b2ef-4cba-a75d-dd06291a979b	5e7ccade-69e5-4d15-9196-651154d1c573	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0059844e-5e16-49f8-8457-e111e29e29f1	29a81920-6040-4571-b504-adf6ad955f68	3b76644e-54a3-47aa-a273-83edb9a89e68	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
1865a97f-f258-40d6-b4bb-628fb28d9481	645fa349-a454-4f3b-ae46-162f27c122c6	72fd3fef-00c3-490b-b091-66a346e978d3	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
91e69393-39f6-4cfa-8d87-0cba3ec82a53	6eb32ee1-fdc4-4756-92fe-d2938f925e7c	92d0e9e1-c713-460b-8c23-6ff5a58e0d90	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
2198489c-d127-4afa-bfde-e5b0a1ba7e64	9a9ede2c-db78-4288-837e-3e5d48a3edea	c08ceff3-c2ff-4f70-ab1e-3b91220383cb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0a39c13e-a47b-4906-9f47-f2a7b5b6c1da	0ebd5aef-fcf4-4cf7-ba05-2dc51a681a67	c485653c-c417-4422-873e-20882a65ed85	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
415c375e-ea6e-4dbe-9711-a33fd8014274	96a78d61-d455-40e2-8d77-13bb25f5e957	f54e22f2-ad4d-42a9-bfac-e44426d1c863	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	\N	\N	\N	\N	\N	SCHEDULED	\N	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
2bd9fc1f-a105-44e7-b9ca-ba0204281c8a	a5018aa7-b37e-4b62-8195-1b3317e44a8d	1eafc6c6-5af9-4b03-82c0-17503007149a	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
d610976f-1374-4219-8db7-efd41d731862	120f3b2a-c89f-45cd-801f-d7116aeee256	2408cace-27a2-497b-95b2-51d3f1e379d0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
944f8124-076d-43b6-9bfd-e70450befd0f	44c567a4-a8bb-4b77-93c5-9ef07cfb3760	675904cb-2e3f-4f18-994f-4bc1d061c9ed	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
4dfde5fb-7790-48b8-b948-f92c5ede2c82	d8097e37-b763-43f7-ba3f-8f41ca7a96b7	fc5a4620-4644-4aa4-a559-dfbe20334c97	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
601af261-3e69-4101-8e0f-55ee79c0e725	c9ff98b8-4ee4-4eb6-8862-c5c14ec90523	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
9ad8a350-3d40-45ba-bb4e-00813d000c58	d1902249-aeb5-4042-9cb5-fd422ecdc933	e0b9b301-ae9a-4224-b0d4-e0ea5ea764cb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
9739d8a0-6a23-48e0-81a8-5aa16c8d4f7f	e7aa1b95-600d-4ed9-afa7-a5837d58c724	1eafc6c6-5af9-4b03-82c0-17503007149a	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
7a7fdc0e-3952-44cd-bded-7421e10352d8	5643ef7c-890d-46da-9ff8-ef4fd17994a2	2408cace-27a2-497b-95b2-51d3f1e379d0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
afa12929-bd02-4ec2-9e1e-dbb98de3f116	56e371b1-f589-47b3-9758-e89a1565feeb	fc5a4620-4644-4aa4-a559-dfbe20334c97	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
53de7e16-d934-4c7c-9224-0729692d9c32	2b2e8138-4de2-424f-b60f-ac8dbceacc9a	d7e7e52b-ec77-4494-80dd-c55ed36816f7	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
20995f91-651a-46f5-b036-bb4c284459e5	68798ffd-83c0-404f-af33-27d7fda82511	6333de00-b21d-4bab-8ce0-19921dadc2fa	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
501e8ebc-99ab-4709-93bb-04eb12c89c60	2275c219-3876-4c1b-bc01-68b01820974c	1a032539-9a4a-4805-8b07-6ebd6aceec91	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
355a9823-9671-4de0-a554-e358ee10a1a8	41db8667-8aaa-4a57-b1f0-4d4a57b449a6	312ab9a9-dc00-4fda-9848-ee684a3bdd0f	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
ed90dde9-7238-4012-b4db-40c321d8c83f	a7537ae7-13c3-4b05-af07-1ad6c48df046	ecf3c70a-ef04-4442-b913-f70e4dee1b17	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
6a33714c-dd69-41ad-9c57-644ea827a4c0	b7f1310c-c6f1-4818-b15a-d9769e442f27	563d6af6-4c01-40c8-99d3-1e65aafe27cc	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
12efa8dc-4029-43d0-aaa5-75e317c659e4	5df58748-b29b-4766-b071-bfe4f51ec23f	31e33e6a-99d0-4004-ac72-2265d9f5d012	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
298adc96-c086-465a-b9a7-71ce7a1a0c7c	3ecb5cc7-449b-4c59-b719-0b83c3a1efce	a3b76924-9822-4e28-8aab-c7fb81daba01	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
025f6d43-e11c-4279-9ffa-cc718fa3adbe	aba5626d-3dee-4d79-9dbd-4d3735416175	da269c9d-031c-48c9-898a-e68d94a8d5b6	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
2f3fc35b-283f-4236-9b44-cebf67edb25b	5bd89560-4eed-4f71-b50d-f425ed579e3e	d8b5ad5a-0d19-44e3-8a49-602b533e7c1a	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
743635b7-b753-40ed-a405-9943e57cf662	0ea7b880-d9ca-4f10-a84c-a798f1bff605	ad15affc-42e9-40aa-a7c8-da8a1e6d323f	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
fce065f9-1078-4cd6-929f-0cf92c62df68	d968e775-9463-4dfb-8e7f-772dfbfbf1ca	2487fa14-f28d-43ae-8bd6-7899fb7b07d0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
e42e2f4b-226f-42ec-a3d1-6cbc86297282	98ec0e83-7684-4202-b7b5-9e26fa34d060	8463c290-4d93-4e90-9d3b-c0a798eff6a3	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
4af64d91-5904-4373-9d97-4d2a591fa508	e5251e1c-32f7-4910-be76-5a7b597081c0	adcdd400-e7eb-4827-bf3e-24b969cfdfc0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3be295cf-5507-41f7-8e8b-0c4e58be8c61	25dfe824-d9fd-4e37-8ce8-3413e9446532	d52f1e6d-7cd8-45b7-97ae-bd26211d7980	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
b5a5f26f-5ae6-4934-94a4-f34309795007	b848585d-e988-4b05-926e-decb6023b845	667ca3a6-212d-4669-a4da-50224377399e	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
fa459e01-67f7-490f-9eaf-08ed2d873e5a	0f8ae21c-859a-4944-a5c9-fca4a6c20f4d	ea2f00b2-bf51-42d0-8407-2981cd02f964	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
f116445f-5502-4f80-9ad4-3caf5427bad7	ad022d65-86d4-48db-9a18-88beda8c5920	2f2ba06d-9233-422f-853b-20ed45f6bebe	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0e13b9b8-413a-4b8b-a70e-e71744c7afc5	0f4f882e-5992-4085-b4e2-18b943b8f914	f9a9e0e0-78a1-4b00-a2cc-2315709d0bec	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0968928b-0781-4738-b15e-4c85297b946c	54e45889-0c2d-4aff-9e04-a18d18ef13da	9070b23b-8612-4242-acb4-05f0472e168b	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
d5e16a26-d8c8-4854-bad9-e2baffe9ce4d	46650b89-7d1b-41bd-a136-6d35e22ee17e	ed44058a-9772-481c-a9b7-eee3af0380f6	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
f48d320e-8860-431d-9e78-70f1cabebb1f	ee8ee8cb-6712-4425-b152-57dba7f88121	30cb7537-0817-423b-8e57-132cb8514e83	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
8c6f0d6e-1777-4aa8-af14-c473f37759bb	20104f9f-1e6e-486d-a99e-f4637b21ba02	12ff9eb4-d1cc-4b1a-a9d6-e5096f9f70c5	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
0d126a1b-03ac-4c29-87de-c26712f8d1b9	94426dfe-afc4-4f54-be6d-c4c7bcfa7924	ff9e75e3-a4be-4059-89da-7d6f4a4163bc	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
ec728759-308d-489a-8e8b-8097192fba70	e9afc1cb-c9dc-49ff-99f7-7562eb48fee2	c3cbd731-904d-4c28-8c8e-663c2d4f7a6b	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
fab856f6-e74e-4245-8176-c68329a2ceed	8bf28fcc-cf73-4e1c-9e4c-87cdddd99806	aafd88d3-4c43-47c8-9351-7e25ceb6a8b8	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
56c050c4-04b1-4343-8e0f-163058b09165	a0507136-9bbc-4724-867c-c587c8225e36	89dd59bd-7a3f-4422-b70c-b0da758c2b7c	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
54faed79-d8f8-48fb-bafa-fa784321a634	a896943d-8ae2-45df-ac9a-a84806a13c87	c5739442-e088-4082-8ba9-369309ce896b	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
8af03ade-8b3c-4308-a5fe-e89cea882fbc	986cc265-b380-4d99-a607-781c9aa0f78a	096bc5d6-77a2-4d13-93cf-8aa99a141ed0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
2f6f292b-1b31-44bf-82ac-a9306c093b86	917cc413-45b4-4b5f-94a0-9e9b6f4211ad	96ea73d5-f80d-4a76-803f-44ae4acbbf06	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
be9be5e2-5d46-4634-944c-583cbc32eb80	54bd07fa-a411-41bc-a59a-6b7a2ab25f20	5f209a49-159c-4798-b32d-62b9afe33eb0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
48341cc6-7aac-4d50-b3fe-d6bffc3f57fb	0fc9a59f-4104-40ee-8283-6609a4556969	117c1d82-6651-48ba-9ae0-8e37b3020062	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
95691b64-90b1-4e7c-895a-9878cfc9f23f	09b74736-885e-40c8-8637-86979df7baf8	9d434d0d-1d80-4d77-80a1-d22fba0bdb65	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
f39607d4-a87e-4580-87d5-e0f3fdf6a72f	84b0231c-6504-4a64-be60-d205f1d55dc3	c52c9aa5-f227-4631-b43a-19ffdfd0917c	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
b35b8373-0419-44d2-b0c2-85405863905d	b4a54dff-14ec-4ad9-af8c-c43106453ccf	9b763dda-f572-46ae-b140-01d7ed0a39a0	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3a0dce83-39a0-45bb-ba74-9f3e5ea4e5b9	e6c350c2-cb9c-474d-87d0-ac92afc6a678	25774ac1-fd82-4f3a-b6c2-df0beceef04d	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
70824f21-d93b-4080-9b02-e21f25af6d2a	d48b676a-34e7-4bf0-95dd-ed4234cea1b3	fe713bf0-1fe7-4bae-b877-4bf9ad431bbb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
4f436b48-7c2c-4166-978a-acf0b22aa53a	510cee12-ea31-48ba-a9b6-4d57361879d3	6cbd85da-b5a2-4c81-a2ea-b0164d8c5865	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
a1dd15af-9486-4083-9a9e-c375b496ade8	37035696-793f-4370-8156-0de6587fd533	377cadec-13ac-483f-b592-f8c0c65a6913	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
94bc1e14-d8dc-42c2-806c-35f2166a8395	53dcc738-5fad-4bde-a52c-b4cba775de5b	7a7bba31-0a14-44d6-b7ce-4d4626be3957	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
d53d0132-0377-46fc-ab3f-7320754159fa	2fdec3f2-eeb7-493a-8af0-1f9f8b98efe2	ebfdba8a-a666-42a0-a7b0-4af3e1f15263	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
a005bf58-814d-47fc-901b-2dd036e0cdb5	aafc05b7-88e4-4c35-bb4f-783c23a70b1b	e5491fc8-112e-41c8-96c2-091f40c56cfb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
7edec1b2-14db-4069-88cc-968b6c01bb74	c6d03410-c436-421b-98b5-417890fac522	1f4e7b7e-54b8-42aa-95bc-6e4916258435	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
27364ea2-e337-4610-979f-494df08dd6f0	fe6ba3ac-e0a3-4f4d-aeab-9df32fd4f690	bc8dc8d4-abe9-4e55-8241-b1c2847ca272	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3dea3956-b5b2-4aa8-8650-00d5d0413bf6	2f7165fd-ad9f-4652-8a5c-d90bfa3040fd	8ce33615-a30a-415f-9a37-ef685af1fded	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3da5fec5-0fbb-4a22-a6d4-93b5ad6d1578	2d526f34-11c6-45c5-8064-eb4e9fc3d674	fc52f98d-b746-4836-bd36-c8d5ccbe46eb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3af64476-1e81-4484-9bdb-2db4dc7d3dc8	77d3e532-2ce6-4711-b185-f6fb67e5120f	95d0cf64-841f-43a7-a738-ac2f78e5716b	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
239d072b-e465-4f10-b53d-1b98a7e0ed67	ffdcbbf9-1eb3-419a-9112-6076000d25fb	d5e96494-d4f4-4529-8e7b-3664920dbbda	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
b03526bf-6dd8-4ab6-9bff-27d605f6f78b	8713491b-bb17-4928-a2a2-c053c41ad15c	1b9de2de-ad00-4c8c-86c8-44ef5f95a3e5	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
442c0639-1304-4f8e-9ee5-50ab3c19c28e	b031db71-8edb-4b95-92df-f7f9c550841f	c65bab30-cc9d-4bcc-9ca6-be0e61191e39	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
c6e891c7-8e11-4fe1-9be7-bcc6241dce79	f0b08cfe-b4f0-47de-9c01-f64b607803a5	56822283-8d34-4d84-9ceb-6281acf28d5b	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
62e1bacb-79d6-4280-87b3-51f7ad447760	ab85f569-8177-4799-8ba9-0f3728ee4f73	75343fdf-5a8f-4dfd-ad5b-63e2552bd71f	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
987fdb1b-0ef1-4ee7-a639-298896ce059a	2d04707f-1c49-44e5-a748-15a77dbc9918	45b681df-e2b3-4a09-8ae0-16684d33b588	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
96859404-38bf-4065-b652-32817f02077c	113e65f6-73b2-4985-9abf-7f55bd2e1141	f03e7a35-00c5-496d-8388-84971fc67c2c	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
34e6eaa2-7fcf-4557-9630-9e513ed24034	b628a98f-87ae-42c8-8b84-bf8a8aa655ad	8835717d-c031-4d9a-9af3-20f5b18720d4	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
1da3e323-7042-439f-8419-7db0839bc10d	e8fee11f-bafb-4c4e-aa55-e37b7dc61ca3	53a5203c-e09f-492a-b59b-5d50d8f1aea1	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
778df46b-1fc2-456f-8957-4b4fec63cf02	98deb313-2562-4f26-83e3-f6bdb57070d6	b9baa47f-3a0a-4120-88e8-cba154fde4f6	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
9e8702e3-3160-4376-b76d-543720b78f93	490921e0-0b6f-4785-9d2b-3ec90fd4acba	af260e05-2819-44b4-8836-06e474b70647	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
6042c61b-1cbc-478f-9bfc-5cae94486c76	87550c63-3821-4214-b19a-f019c18361dc	340f0cb9-d8e0-44e5-9a71-6d949dcd3bd1	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
a5f141e1-b2ba-41ac-a8bc-c3cdf9575737	378f6a08-e2d1-4b04-a701-39177665822a	b89dd81c-0b41-4c3d-aee1-28340321c151	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
e0e626ad-fd49-400d-92ee-148a726aca5a	9cf1d33f-17fe-4517-9e32-1c37079a5900	3df5d081-ebb8-4110-919f-f496340287b5	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
955fb097-1b81-4561-8bda-d8b4c766399b	0b5c7247-ef5b-41da-9328-77ef5edb11c4	f80207a8-caaa-4f75-b352-eb504ae2cf31	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
dc1bffe5-8e29-47e3-a13b-c047b3c4d109	91267bb7-77fa-4f3e-b0ed-a1ec81374105	583b01c8-510f-4196-ae00-674098ae9408	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
bbfd8925-1f45-42d5-8151-1ed1a6f7764c	b94ab3e4-563a-4e93-a07c-5d8885287275	336cd48d-1851-47d6-83df-d835dc1836fb	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
2ee797d9-6587-4e8a-88aa-3a97e3d5be09	f0ec6d91-2376-4a66-aaf9-79d56249bd0a	cf521eec-7a13-4e1f-af64-b4575b75dc02	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
3f41dd58-c5e7-49d0-8755-cf27309e6c08	61738fdb-fc5b-4733-a06a-5eff06c5e766	36e7d2bb-a3e5-4bd3-beb7-0a97d249e694	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
edd8dc15-24d3-44f3-bbd7-33f6631db4e7	a8436466-7b06-49fc-b10c-1a4fff0f10a0	01b11d7d-39c4-4caa-8c7b-eee772073f4f	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
fc9132a5-6e17-48f6-9397-e659e8c1dd9c	54859b4b-298b-43c0-947f-9ff2b784caf2	f08f63b0-e11c-452a-8495-3daa7a300352	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	WAITING	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
03ffe84c-36a8-4f80-b780-9e81f561765f	2019a02d-755a-4ff1-a475-69e91c35ff6c	f0034829-f39c-4ce2-886c-6c01c5f8e444	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
54c19f2f-30ab-4926-939d-f7dbd678b004	cb233dff-b245-41e1-94fb-776ef36b7cae	5c732df0-c68d-45d0-a9d8-15e5fc9b1316	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
4cc50687-cd9d-43c6-a33a-cf3ec57a449c	e197cfbe-660b-4445-8262-b7a3ea9e78f9	c977629e-3832-4007-a4b6-85d3a6078cab	418ef4e2-fc2a-4fd9-b1de-a384c9578385	5431c6ad-01d3-408e-b60b-1c55fb6eb854	2026-03-02 03:37:18.514367	\N	2026-03-04 03:38:54.961692	\N	\N	\N	\N	COMPLETED	SOLD	\N	2026-03-04 03:37:18.514367	2026-03-04 03:37:18.514367
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: lead_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_status_history_id_seq', 663, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


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
-- Name: lead_status_history lead_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_pkey PRIMARY KEY (id);


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
-- Name: visit_photos visit_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_photos
    ADD CONSTRAINT visit_photos_pkey PRIMARY KEY (id);


--
-- Name: visit_requests visit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_requests
    ADD CONSTRAINT visit_requests_pkey PRIMARY KEY (id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_created ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_lead ON public.activity_logs USING btree (lead_id);


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
-- Name: idx_campaigns_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_is_active ON public.campaigns USING btree (is_active);


--
-- Name: idx_deals_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_lead_id ON public.deals USING btree (lead_id);


--
-- Name: idx_deals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_status ON public.deals USING btree (status);


--
-- Name: idx_lead_status_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_status_history_created_at ON public.lead_status_history USING btree (created_at);


--
-- Name: idx_lead_status_history_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history USING btree (lead_id);


--
-- Name: idx_lead_status_history_new_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_status_history_new_status ON public.lead_status_history USING btree (new_status);


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
-- Name: idx_leads_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_district ON public.leads USING btree (district);


--
-- Name: idx_leads_next_callback; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_next_callback ON public.leads USING btree (next_callback_at) WHERE (next_callback_at IS NOT NULL);


--
-- Name: idx_leads_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_phone_number ON public.leads USING btree (phone_number);


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
-- Name: idx_visit_photos_visit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_photos_visit_id ON public.visit_photos USING btree (visit_id);


--
-- Name: idx_visit_requests_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_requests_lead_id ON public.visit_requests USING btree (lead_id);


--
-- Name: idx_visit_requests_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_requests_requested_by ON public.visit_requests USING btree (requested_by);


--
-- Name: idx_visit_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_requests_status ON public.visit_requests USING btree (status);


--
-- Name: idx_visits_field_exec_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_field_exec_id ON public.visits USING btree (field_exec_id);


--
-- Name: idx_visits_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_lead_id ON public.visits USING btree (lead_id);


--
-- Name: idx_visits_scheduled_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_scheduled_at ON public.visits USING btree (scheduled_at);


--
-- Name: idx_visits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_status ON public.visits USING btree (status);


--
-- Name: leads enforce_lead_status_transitions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_lead_status_transitions BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.validate_lead_status_transition();


--
-- Name: leads track_lead_status_changes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER track_lead_status_changes AFTER UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();


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
-- Name: activity_logs activity_logs_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


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
-- Name: deals deals_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: deals deals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deals deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_status_history lead_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_status_history lead_status_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


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
-- Name: visit_photos visit_photos_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_photos
    ADD CONSTRAINT visit_photos_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- Name: visit_requests visit_requests_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_requests
    ADD CONSTRAINT visit_requests_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: visit_requests visit_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_requests
    ADD CONSTRAINT visit_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: visits visits_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: visits visits_field_exec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_field_exec_id_fkey FOREIGN KEY (field_exec_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: visits visits_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: visits visits_visit_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_visit_request_id_fkey FOREIGN KEY (visit_request_id) REFERENCES public.visit_requests(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HQLGbxaoSVkQKTrdy6U264GR1qIhYImAml7G3auoZddbUoOfGxovM35bW90nasf

