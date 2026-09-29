// =============================================
// EVI - AI Service
// "Ask My Household" natural language interface
// =============================================

import { ChatMessage, ChatSource, HouseholdDocument, HouseholdTask, Vehicle, HomeProfile } from '../types';

// Uses a Firebase Cloud Function endpoint that wraps OpenAI (askHousehold,
// deployed, us-central1) so the API key never reaches the client.

const CLOUD_FUNCTION_URL = 'https://us-central1-evi-house-manager.cloudfunctions.net/askHousehold';

export interface HouseholdContext {
  homeProfile: HomeProfile | null;
  documents: HouseholdDocument[];
  tasks: HouseholdTask[];
  vehicles: Vehicle[];
}

export interface AskResponse {
  content: string;
  sources: ChatSource[];
}

/**
 * Ask the AI a question about the household.
 * Uses Firebase Cloud Function that wraps OpenAI, so the API key stays on the server.
 */
export async function askHousehold(
  question: string,
  context: HouseholdContext,
  history: ChatMessage[] = []
): Promise<AskResponse> {
  const contextSummary = buildContextSummary(context);
  const messages = [
    {
      role: 'system' as const,
      content: buildSystemPrompt(contextSummary),
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: question },
  ];

  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context: contextSummary }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content || 'I was unable to generate a response.',
      sources: data.sources || [],
    };
  } catch (err) {
    // Fallback response if Cloud Function isn't deployed yet
    return {
      content: getFallbackResponse(question, context),
      sources: [],
    };
  }
}

// ---- Context Building ----

function buildSystemPrompt(context: string): string {
  return `You are EVI, an AI assistant that helps a family or individual manage their household. You have access to their home information, documents, tasks, and vehicles.

Your personality:
- Warm, helpful, and proactive
- Concise but thorough
- Speak like a knowledgeable friend, not a corporate bot
- Suggest actions when relevant

Household context:
${context}

Answer the user's question using ONLY the information above. If you don't have enough information, say so and suggest what they could add. Never make up specific dates, amounts, or details.`;
}

function buildContextSummary(ctx: HouseholdContext): string {
  const parts: string[] = [];

  if (ctx.homeProfile) {
    parts.push('=== HOME PROFILE ===');
    parts.push(`Type: ${ctx.homeProfile.type}`);
    if (ctx.homeProfile.address) {
      parts.push(`Address: ${ctx.homeProfile.address.street}, ${ctx.homeProfile.address.city}, ${ctx.homeProfile.address.state}`);
    }
    if (ctx.homeProfile.type === 'rent') {
      if (ctx.homeProfile.leaseEndDate) {
        parts.push(`Lease ends: ${ctx.homeProfile.leaseEndDate.toLocaleDateString()}`);
      }
      if (ctx.homeProfile.monthlyRent) {
        parts.push(`Monthly rent: $${ctx.homeProfile.monthlyRent}`);
      }
      if (ctx.homeProfile.landlordName) {
        parts.push(`Landlord: ${ctx.homeProfile.landlordName}${ctx.homeProfile.landlordPhone ? ` (${ctx.homeProfile.landlordPhone})` : ''}`);
      }
    } else {
      if (ctx.homeProfile.purchaseDate) {
        parts.push(`Purchased: ${ctx.homeProfile.purchaseDate.toLocaleDateString()}`);
      }
      if (ctx.homeProfile.squareFootage) {
        parts.push(`Square footage: ${ctx.homeProfile.squareFootage}`);
      }
      if (ctx.homeProfile.yearBuilt) {
        parts.push(`Year built: ${ctx.homeProfile.yearBuilt}`);
      }
    }

    if (ctx.homeProfile.appliances?.length) {
      parts.push('\nAppliances:');
      ctx.homeProfile.appliances.forEach((a) => {
        parts.push(`- ${a.name}${a.brand ? ` (${a.brand} ${a.model || ''})` : ''}${a.warrantyExpiry ? `, warranty until ${a.warrantyExpiry.toLocaleDateString()}` : ''}`);
      });
    }
  }

  if (ctx.vehicles.length) {
    parts.push('\n=== VEHICLES ===');
    ctx.vehicles.forEach((v) => {
      const parts2: string[] = [`${v.year} ${v.make} ${v.model}`];
      if (v.registrationExpiry) parts2.push(`registration expires ${v.registrationExpiry.toLocaleDateString()}`);
      if (v.insuranceExpiry) parts2.push(`insurance expires ${v.insuranceExpiry.toLocaleDateString()}`);
      if (v.mileage) parts2.push(`${v.mileage} miles`);
      parts.push('- ' + parts2.join(', '));
    });
  }

  if (ctx.tasks.length) {
    const pending = ctx.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    if (pending.length) {
      parts.push('\n=== ACTIVE TASKS ===');
      pending.slice(0, 20).forEach((t) => {
        parts.push(`- ${t.title}${t.dueDate ? ` (due ${t.dueDate.toLocaleDateString()})` : ''} [${t.priority}]`);
      });
    }
  }

  if (ctx.documents.length) {
    parts.push('\n=== DOCUMENTS ===');
    ctx.documents.slice(0, 30).forEach((d) => {
      parts.push(`- ${d.title} [${d.category}]${d.summary ? `: ${d.summary}` : ''}`);
    });
  }

  return parts.length ? parts.join('\n') : 'No household data yet.';
}

// ---- Fallback (when Cloud Function isn't reachable) ----

function getFallbackResponse(question: string, ctx: HouseholdContext): string {
  const q = question.toLowerCase();

  if (q.includes('lease') && (q.includes('expire') || q.includes('end'))) {
    if (ctx.homeProfile?.leaseEndDate) {
      const days = Math.ceil((ctx.homeProfile.leaseEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `Your lease expires on ${ctx.homeProfile.leaseEndDate.toLocaleDateString()} — that's ${days} days from now.`;
    }
    return "I don't have your lease end date yet. Add it in Home Details, or upload your lease and I'll extract it for you.";
  }

  if (q.includes('task') || q.includes('todo') || q.includes('week')) {
    const upcoming = ctx.tasks
      .filter((t) => t.status !== 'completed' && t.dueDate)
      .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
      .slice(0, 5);

    if (upcoming.length) {
      return `Here's what's coming up:\n\n${upcoming.map((t) => `• ${t.title} — ${t.dueDate!.toLocaleDateString()}`).join('\n')}`;
    }
    return 'You have no upcoming tasks. Add some in the dashboard.';
  }

  if (q.includes('vehicle') || q.includes('car') || q.includes('registration')) {
    if (ctx.vehicles.length === 0) {
      return "You haven't added any vehicles yet. Add one from your Profile > Vehicles.";
    }
    return ctx.vehicles
      .map((v) => `${v.year} ${v.make} ${v.model}${v.registrationExpiry ? ` — registration expires ${v.registrationExpiry.toLocaleDateString()}` : ''}`)
      .join('\n');
  }

  return "I'd love to help with that, but I need more information about your household to give you a useful answer. Try adding your home details, uploading documents, or creating tasks so I can learn about you.";
}
