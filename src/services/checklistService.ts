// =============================================
// EVI - Checklist Service
// Turns a ChecklistTemplate into real household tasks.
// =============================================

import { createTask } from './taskService';
import { getChecklistTemplate } from '../data/checklistTemplates';
import { HouseholdTask } from '../types';
import { Analytics } from './analyticsService';

/**
 * Instantiate a checklist template into real tasks for a household.
 * @param anchorDate The move-in/move-out date for templates that use one.
 *   Ignored (treated as "today") for templates where usesMoveDate is false.
 * @param selectedItemIds Optional subset of item ids to create tasks for.
 *   If omitted, all items in the template are used.
 */
export async function applyChecklistTemplate(
  householdId: string,
  userId: string,
  templateId: string,
  options?: { anchorDate?: Date; selectedItemIds?: string[] }
): Promise<HouseholdTask[]> {
  const template = getChecklistTemplate(templateId);
  if (!template) throw new Error(`Unknown checklist template: ${templateId}`);

  const anchor = options?.anchorDate || new Date();
  const items = options?.selectedItemIds
    ? template.items.filter((i) => options.selectedItemIds!.includes(i.id))
    : template.items;

  const created: HouseholdTask[] = [];
  for (const item of items) {
    const dueDate = new Date(anchor);
    dueDate.setDate(dueDate.getDate() + item.dayOffset);

    const task = await createTask(householdId, userId, {
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority || 'medium',
      dueDate,
    });
    created.push(task);
  }

  Analytics.taskCreated(`checklist_${templateId}`);

  return created;
}
