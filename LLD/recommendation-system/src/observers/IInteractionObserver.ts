import { Interaction } from '../models/Interaction';

export interface IInteractionObserver {
  onInteractionRecorded(interaction: Interaction): void;
}