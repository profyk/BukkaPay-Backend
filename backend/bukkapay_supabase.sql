-- ============================================
-- BukkaPay Database Schema for Supabase
-- A comprehensive mobile wallet application
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    wallet_id VARCHAR NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    phone TEXT,
    country_code TEXT DEFAULT '+1',
    password TEXT,
    avatar TEXT,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet_id ON users(wallet_id);

-- WebAuthn Credentials for Biometric Login
CREATE TABLE webauthn_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    device_type TEXT,
    transports TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);

-- ============================================
-- WALLET & CARDS
-- ============================================

CREATE TABLE wallet_cards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT '$',
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    card_number TEXT NOT NULL,
    frozen BOOLEAN DEFAULT FALSE,
    spending_limit DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_wallet_cards_user ON wallet_cards(user_id);

-- Virtual Cards
CREATE TABLE virtual_cards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_number VARCHAR NOT NULL UNIQUE,
    cvv VARCHAR NOT NULL,
    expiry_date VARCHAR NOT NULL,
    spending_limit DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_virtual_cards_user ON virtual_cards(user_id);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE transactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id VARCHAR REFERENCES wallet_cards(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- CONTACTS & BENEFICIARIES
-- ============================================

CREATE TABLE contacts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    color TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_contacts_user ON contacts(user_id);

CREATE TABLE beneficiaries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    wallet_id VARCHAR NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_beneficiaries_user ON beneficiaries(user_id);

-- ============================================
-- PAYMENT REQUESTS
-- ============================================

CREATE TABLE payment_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    recipient_name TEXT,
    recipient_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);

-- ============================================
-- LOYALTY & GAMIFICATION
-- ============================================

CREATE TABLE loyalty_rewards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL,
    points_redeemed INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_loyalty_user ON loyalty_rewards(user_id);

CREATE TABLE challenges (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target DECIMAL(10, 2),
    current DECIMAL(10, 2) DEFAULT 0,
    reward INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_challenges_user ON challenges(user_id);

CREATE TABLE achievements (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================
-- AUTO PAY & BILLS
-- ============================================

CREATE TABLE auto_pays (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    frequency TEXT NOT NULL,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_auto_pays_user ON auto_pays(user_id);

CREATE TABLE bill_splits (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    creator_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    participants JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_bill_splits_creator ON bill_splits(creator_id);

-- ============================================
-- SUPPORT CHAT
-- ============================================

CREATE TABLE chat_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user_message BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);

-- ============================================
-- SECURITY SETTINGS
-- ============================================

CREATE TABLE security_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cards_frozen JSONB,
    whitelisted_merchants JSONB,
    fraud_alerts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_security_settings_user ON security_settings(user_id);

-- ============================================
-- FAMILY ACCOUNTS
-- ============================================

CREATE TABLE family_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'child',
    monthly_allowance DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_family_members_parent ON family_members(parent_id);

-- ============================================
-- STOKVELS (SAVINGS GROUPS)
-- ============================================

CREATE TABLE stokvels (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    creator_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    purpose TEXT,
    contribution_amount DECIMAL(10, 2) NOT NULL,
    contribution_frequency TEXT NOT NULL,
    payout_date TIMESTAMP WITH TIME ZONE,
    total_members INTEGER DEFAULT 1,
    total_contributed DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    icon TEXT DEFAULT '👥',
    color TEXT DEFAULT 'from-purple-600 to-pink-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stokvels_creator ON stokvels(creator_id);

CREATE TABLE stokvel_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    stokvel_id VARCHAR NOT NULL REFERENCES stokvels(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_contributed DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    UNIQUE(stokvel_id, user_id)
);

CREATE INDEX idx_stokvel_members_stokvel ON stokvel_members(stokvel_id);
CREATE INDEX idx_stokvel_members_user ON stokvel_members(user_id);

CREATE TABLE stokvel_contributions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    stokvel_id VARCHAR NOT NULL REFERENCES stokvels(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stokvel_contributions_stokvel ON stokvel_contributions(stokvel_id);

CREATE TABLE stokvel_payouts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    stokvel_id VARCHAR NOT NULL REFERENCES stokvels(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payout_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stokvel_payouts_stokvel ON stokvel_payouts(stokvel_id);

-- ============================================
-- MERCHANTS
-- ============================================

CREATE TABLE merchants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_category TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    payment_link TEXT NOT NULL UNIQUE,
    wallet_balance DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit DECIMAL(10, 2) DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_merchants_user ON merchants(user_id);
CREATE INDEX idx_merchants_qr ON merchants(qr_code);
CREATE INDEX idx_merchants_payment_link ON merchants(payment_link);

CREATE TABLE merchant_transactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    merchant_id VARCHAR NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payer_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    payer_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'payment',
    status TEXT NOT NULL DEFAULT 'completed',
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_merchant_transactions_merchant ON merchant_transactions(merchant_id);
CREATE INDEX idx_merchant_transactions_created ON merchant_transactions(created_at DESC);

-- ============================================
-- RENTAL PAYMENT SYSTEM
-- ============================================

CREATE TABLE properties (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    merchant_id VARCHAR NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    landlord_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    property_type TEXT NOT NULL DEFAULT 'apartment',
    total_units INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_properties_merchant ON properties(merchant_id);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);

CREATE TABLE property_units (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    property_id VARCHAR NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_property_units_property ON property_units(property_id);

CREATE TABLE tenants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL UNIQUE,
    property_id VARCHAR NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id VARCHAR NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    move_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_user ON tenants(user_id);
CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);

CREATE TABLE rent_payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id VARCHAR NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id VARCHAR NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    merchant_id VARCHAR NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    rent_month TEXT NOT NULL,
    payment_method TEXT DEFAULT 'wallet',
    status TEXT NOT NULL DEFAULT 'completed',
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rent_payments_tenant ON rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_property ON rent_payments(property_id);
CREATE INDEX idx_rent_payments_month ON rent_payments(rent_month);

CREATE TABLE rent_payment_links (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    link_code TEXT NOT NULL UNIQUE,
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    merchant_id VARCHAR NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    rent_month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rent_payment_links_code ON rent_payment_links(link_code);

-- ============================================
-- GIFT CARDS
-- ============================================

CREATE TABLE gift_cards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_email TEXT,
    recipient_phone TEXT,
    recipient_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT '$',
    message TEXT,
    code VARCHAR NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    design TEXT NOT NULL DEFAULT 'default',
    redeemed_by VARCHAR REFERENCES users(id),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_gift_cards_sender ON gift_cards(sender_id);
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- ============================================
-- CONTRIBUTION GROUPS (CROWDFUNDING)
-- ============================================

CREATE TABLE contribution_groups (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    creator_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target_amount DECIMAL(10, 2),
    current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT '$',
    share_code VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_contribution_groups_creator ON contribution_groups(creator_id);
CREATE INDEX idx_contribution_groups_share_code ON contribution_groups(share_code);

CREATE TABLE contributions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id VARCHAR NOT NULL REFERENCES contribution_groups(id) ON DELETE CASCADE,
    contributor_id VARCHAR REFERENCES users(id),
    contributor_name TEXT NOT NULL,
    contributor_phone TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_contributions_group ON contributions(group_id);
CREATE INDEX idx_contributions_contributor ON contributions(contributor_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_pays ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvel_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvel_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your auth setup)
-- Users can only read/write their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own cards" ON wallet_cards
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own payment requests" ON payment_requests
    FOR ALL USING (auth.uid()::text = user_id);

-- Public access for contribution groups (for public share links)
CREATE POLICY "Anyone can view active contribution groups" ON contribution_groups
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can contribute to active groups" ON contributions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM contribution_groups WHERE id = group_id AND is_active = TRUE)
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate wallet ID
CREATE OR REPLACE FUNCTION generate_wallet_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BKP-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate tenant ID
CREATE OR REPLACE FUNCTION generate_tenant_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TEN-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CON-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'GC-' || upper(substring(gen_random_uuid()::text from 1 for 12));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate wallet_id for new users
CREATE OR REPLACE FUNCTION set_wallet_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wallet_id IS NULL THEN
        NEW.wallet_id := generate_wallet_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_wallet_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_wallet_id();

-- Trigger to update contribution group total when contribution is made
CREATE OR REPLACE FUNCTION update_contribution_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contribution_groups
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.group_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contribution_total
    AFTER INSERT ON contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_contribution_total();

-- Trigger to update stokvel total when contribution is made
CREATE OR REPLACE FUNCTION update_stokvel_total()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE stokvels
        SET total_contributed = total_contributed + NEW.amount
        WHERE id = NEW.stokvel_id;
        
        UPDATE stokvel_members
        SET total_contributed = total_contributed + NEW.amount
        WHERE stokvel_id = NEW.stokvel_id AND user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stokvel_total
    AFTER INSERT OR UPDATE ON stokvel_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_stokvel_total();

-- ============================================
-- SEED DATA (Optional - Remove in Production)
-- ============================================

-- Insert sample categories for merchants
-- INSERT INTO merchants (user_id, business_name, business_type, qr_code, payment_link) VALUES ...

-- ============================================
-- END OF SCHEMA
-- ============================================
