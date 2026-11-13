// Shared in-app alarm state (replaces the old window._saymydoc* globals).
import { DEFAULT_ALARM_SOUND } from './alarmSounds.js'

let currentSoundId = DEFAULT_ALARM_SOUND
let listenerBound = false

export const getCurrentAlarmSound = () => currentSoundId || DEFAULT_ALARM_SOUND
export const setCurrentAlarmSound = (id) => { currentSoundId = id }

/** Returns true the first time only — guarantees the alarm listener is bound once. */
export function claimAlarmListener() {
  if (listenerBound) return false
  listenerBound = true
  return true
}
