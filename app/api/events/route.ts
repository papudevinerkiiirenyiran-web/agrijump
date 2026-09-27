import { NextResponse } from 'next/server';
import { seedEvents } from '@/lib/seed';

/**
 * Example API: currently served from JSON.
 * Supabase: swap in supabase.from('events').select('*').
 * Google Sheets: sheets.spreadsheets.values.get, then map to CampusEvent[].
 */
export async function GET() {
  return NextResponse.json({
    count: seedEvents.length,
    events: seedEvents,
  });
}