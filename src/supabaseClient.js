import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qxxsyaaxvcqrzwdmxedb.supabase.co';
const supabaseKey = 'sb_publishable_N7Ey3PHX9NlXpc_-5I3RrQ_RN7Ea_CI';

export const supabase = createClient(supabaseUrl, supabaseKey);