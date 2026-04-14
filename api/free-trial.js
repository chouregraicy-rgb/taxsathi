// api/free-trial.js
// Manages free trial codes for TaxSaathi
// - Create trial codes
// - Validate trial codes
// - Track usage (5 users per code)
// - Check remaining slots

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { action, code, userId, email } = req.body;

  try {
    // ===== ACTION 1: CREATE NEW TRIAL CODE =====
    if (action === 'create') {
      // Generate unique trial code
      const trialCode = `TAXFREE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('trial_codes')
        .insert({
          code: trialCode,
          max_users: 5,
          used_count: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Trial code created successfully',
        trialCode: trialCode,
        data: data[0]
      });
    }

    // ===== ACTION 2: VALIDATE TRIAL CODE =====
    if (action === 'validate') {
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Trial code is required'
        });
      }

      // Fetch trial code details
      const { data: trialData, error: fetchError } = await supabase
        .from('trial_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !trialData) {
        return res.status(404).json({
          success: false,
          error: 'Invalid trial code'
        });
      }

      // Check if code is active
      if (trialData.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: `Trial code is ${trialData.status}`
        });
      }

      // Check if code has expired
      if (new Date(trialData.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Trial code has expired'
        });
      }

      // Check if code has available slots
      if (trialData.used_count >= trialData.max_users) {
        return res.status(400).json({
          success: false,
          error: `Trial code has reached maximum users (${trialData.max_users})`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Trial code is valid',
        code: trialCode,
        remainingSlots: trialData.max_users - trialData.used_count,
        expiresAt: trialData.expires_at
      });
    }

    // ===== ACTION 3: APPLY TRIAL CODE TO USER =====
    if (action === 'apply') {
      if (!code || !userId || !email) {
        return res.status(400).json({
          success: false,
          error: 'Code, userId, and email are required'
        });
      }

      // Validate code first
      const { data: trialData, error: fetchError } = await supabase
        .from('trial_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !trialData) {
        return res.status(404).json({
          success: false,
          error: 'Invalid trial code'
        });
      }

      // Check all conditions
      if (trialData.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: `Trial code is ${trialData.status}`
        });
      }

      if (new Date(trialData.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Trial code has expired'
        });
      }

      if (trialData.used_count >= trialData.max_users) {
        return res.status(400).json({
          success: false,
          error: 'Trial code has reached maximum users'
        });
      }

      // Check if user already used this code
      const { data: existingUsage } = await supabase
        .from('trial_code_usage')
        .select('*')
        .eq('trial_code_id', trialData.id)
        .eq('user_id', userId)
        .single();

      if (existingUsage) {
        return res.status(400).json({
          success: false,
          error: 'This user has already used this trial code'
        });
      }

      // Record the usage
      const { data: usageData, error: usageError } = await supabase
        .from('trial_code_usage')
        .insert({
          trial_code_id: trialData.id,
          user_id: userId,
          email: email,
          applied_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select();

      if (usageError) throw usageError;

      // Increment used count
      const { error: updateError } = await supabase
        .from('trial_codes')
        .update({ used_count: trialData.used_count + 1 })
        .eq('id', trialData.id);

      if (updateError) throw updateError;

      // Create trial subscription for user
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'trial',
          status: 'active',
          trial_code: code,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount_paid: 0,
          is_trial: true
        })
        .select();

      if (subError) throw subError;

      return res.status(200).json({
        success: true,
        message: 'Trial code applied successfully',
        trialDuration: '30 days',
        features: 'Full access to all TaxSaathi features',
        remainingSlotsInCode: trialData.max_users - (trialData.used_count + 1)
      });
    }

    // ===== ACTION 4: CHECK USER TRIAL STATUS =====
    if (action === 'check-status') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      const { data: trialSub, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial', true)
        .eq('status', 'active')
        .single();

      if (error) {
        return res.status(200).json({
          success: true,
          hasActiveTrial: false,
          message: 'No active trial subscription'
        });
      }

      const trialEndDate = new Date(trialSub.trial_end);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Trial has expired
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', trialSub.id);

        return res.status(200).json({
          success: true,
          hasActiveTrial: false,
          message: 'Trial period has expired'
        });
      }

      return res.status(200).json({
        success: true,
        hasActiveTrial: true,
        daysRemaining: daysRemaining,
        trialCode: trialSub.trial_code,
        trialEnd: trialSub.trial_end,
        features: 'Full access to all TaxSaathi features'
      });
    }

    // ===== ACTION 5: GET TRIAL CODE STATS (ADMIN) =====
    if (action === 'stats') {
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Trial code is required'
        });
      }

      const { data: trialData } = await supabase
        .from('trial_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (!trialData) {
        return res.status(404).json({
          success: false,
          error: 'Trial code not found'
        });
      }

      const { data: usage } = await supabase
        .from('trial_code_usage')
        .select('*')
        .eq('trial_code_id', trialData.id);

      return res.status(200).json({
        success: true,
        code: code,
        maxUsers: trialData.max_users,
        usedCount: trialData.used_count,
        remainingSlots: trialData.max_users - trialData.used_count,
        status: trialData.status,
        createdAt: trialData.created_at,
        expiresAt: trialData.expires_at,
        users: usage || []
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action'
    });

  } catch (error) {
    console.error('Trial code error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
