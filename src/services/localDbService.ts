
import { supabase } from './supabaseClient';
import type { User, Calculation, MaterialMasterItem, Machine, Process, Tool, Feedback, RegionCost, RegionCurrencyMap, SubscriberInfo } from '../types';

export const localDb = {
  // Try using the secure backend API with a direct Supabase SDK fallback
  getAll: async <T>(table: string): Promise<T[]> => {
    try {
      const response = await fetch(`/api/${table}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json() as T[];
    } catch (apiError) {
      console.warn(`[API fallthrough] fetching ${table} from Supabase:`, apiError);
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`[DB ERROR] fetching ${table} from Supabase:`, error);
        return [];
      }
      return data as T[];
    }
  },

  getById: async <T extends { id: string }>(table: string, id: string): Promise<T | null> => {
    try {
      const response = await fetch(`/api/${table}/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json() as T;
    } catch (apiError) {
      console.warn(`[API fallthrough] fetching ${table} by id from Supabase:`, apiError);
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error && error.code === 'PGRST116') {
         return null;
      }
      if (error) {
         console.error(`[DB ERROR] fetching ${table} by id:`, error);
         return null;
      }
      return data as T;
    }
  },

  upsert: async <T extends { id: string }>(table: string, item: T): Promise<T> => {
    try {
      const response = await fetch(`/api/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json() as T;
    } catch (apiError) {
      console.warn(`[API fallthrough] upserting ${table} to Supabase:`, apiError);
      const { data, error } = await supabase.from(table).upsert(item).select().maybeSingle();
      if (error) {
         console.error(`[DB ERROR] upserting to ${table}:`, error);
         throw error;
      }
      return (data || item) as T;
    }
  },

  delete: async (table: string, id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/${table}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    } catch (apiError) {
      console.warn(`[API fallthrough] deleting from ${table} in Supabase:`, apiError);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.error(`[DB ERROR] deleting from ${table}:`, error);
    }
  },

  deleteMultiple: async (table: string, ids: string[]): Promise<void> => {
    try {
      // Execute in parallel on the server
      await Promise.all(ids.map(id => fetch(`/api/${table}/${id}`, { method: 'DELETE' })));
    } catch (apiError) {
      console.warn(`[API fallthrough] deleteMultiple from ${table} in Supabase:`, apiError);
      const { error } = await supabase.from(table).delete().in('id', ids);
      if (error) console.error(`[DB ERROR] deleteMultiple from ${table}:`, error);
    }
  },

  insertMultiple: async <T extends { id: string }>(table: string, items: T[]): Promise<T[]> => {
    try {
      const upserted = [];
      for (const item of items) {
        const response = await fetch(`/api/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        upserted.push(await response.json() as T);
      }
      return upserted;
    } catch (apiError) {
      console.warn(`[API fallthrough] insertMultiple ${table} to Supabase:`, apiError);
      const { data, error } = await supabase.from(table).upsert(items).select();
      if (error) {
        console.error(`[DB ERROR] insertMultiple to ${table}:`, error);
        throw error;
      }
      return (data || items) as T[];
    }
  },

  // Auth Supabase Real
  auth: {
    getSession: () => {
      const userStr = localStorage.getItem('costinghub_current_user');
      if (userStr) {
          return { user: JSON.parse(userStr), access_token: 'supabase-token' };
      }
      return null;
    },
    signIn: async (email: string, password?: string) => {
      // 1. Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password'
      });
      if (authError) throw authError;

      // 2. Fetch User Profile
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
      
      let user: any = profileData;
      // Polyfill profile if doesn't exist (super admin trick or fresh auth)
      if (!profileData) {
         user = {
            id: authData.user.id,
            email,
            name: email.split('@')[0],
            role: 'user',
            plan_name: 'Free',
            subscription_status: 'active'
         };
         // Upsert the missing profile into the profiles table
         await supabase.from('profiles').upsert(user);
      }
      
      localStorage.setItem('costinghub_current_user', JSON.stringify(user));
      return user;
    },
    signUp: async (email: string, name: string, password?: string, companyName?: string) => {
      // 1. Supabase Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || 'password'
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Verification email sent, please check your inbox.");

      // 2. Setup Profile Info
      const profile = {
         id: authData.user.id,
         email,
         name,
         company_name: companyName,
         role: 'user',
         plan_name: 'Free',
         calculation_limit: 5,
         calculations_created_this_period: 0,
         subscription_status: 'active'
      };

      // 3. Save to Custom profiles table
      const { data: profileData, error: profileErr } = await supabase.from('profiles').insert(profile).select().maybeSingle();
      if (profileErr) {
         console.warn("Could not save profile immediately. Assuming RLS policy issue or table missing:", profileErr);
      }

      localStorage.setItem('costinghub_current_user', JSON.stringify(profileData || profile));
      return profileData || profile;
    },
    signOut: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('costinghub_current_user');
    },
    updatePassword: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error ? error.message : null };
    },
    requestPasswordReset: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '?view=resetPassword',
      });
      if (error) throw error;
    }
  }
};
