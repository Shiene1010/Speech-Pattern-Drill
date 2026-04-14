# Voice Drill Web Prototype

A browser-based English speech drill prototype that combines command recognition, spoken pattern playback, backward chunk drilling, and simple practice scoring using the Web Speech API.    

## Overview

This project is a lightweight web MVP for testing a speech-first drill experience before committing to a native app implementation. The app presents a target English sentence, listens for spoken commands, reads patterns aloud with browser speech synthesis, and tracks successful practice attempts with a counter.   

## Project Structure

| File | Role |
|---|---|
| `index.html` | Defines the single-page UI shell, including the app container, status area, target text, transcript, counter, and action buttons.  |
| `style.css` | Styles the dark single-screen layout with panels, buttons, and emphasis for the counter and transcript areas.  |
| `app.js` | Implements state, command handling, speech recognition, speech synthesis, scoring, playback flows, and button interactions.  |
| `patterns.js` | Stores the drill sentence list and chunk data for pattern playback and backward sequence drills.  |

## Main Features

- Speech recognition using `SpeechRecognition` or `webkitSpeechRecognition`, configured for English (`en-US`), continuous listening, interim results, and a single best alternative. 
- Speech synthesis using `SpeechSynthesisUtterance` for target playback, chunk playback, backward drill playback, and spoken feedback such as “Good job” or “Try again.” 
- Command mode that listens for phrases mapped to `start`, `backward`, `have a go`, `next`, and `reset`. 
- Practice mode that compares the recognized sentence against the current target sentence and increments the count when the spoken result matches strongly enough. 
- Backward chunk drill support that rebuilds the target sentence from the end using chunk groups stored with each pattern.  

## Current Command Flow

The current implementation starts in command mode and displays the first pattern from the local pattern list. When listening is active, the app accepts command phrases, updates the target or mode, and uses speech synthesis to guide the learner through playback or practice.  

### Supported spoken commands

- `start`: Read the full current target sentence aloud. 
- `backward`: Run the backward chunk drill for the current sentence. 
- `have a go`: Switch into practice mode and prompt the learner to repeat the sentence. 
- `next`: Move to the next sentence in the pattern list. 
- `reset`: Reset the counter, pattern index, transcript, and mode. 

## Pattern Data

The project currently includes five practice patterns, each with a full sentence and chunk array for chunk-based playback. These chunk arrays are used to support both forward chunk speaking and backward buildup drills.  

## Recognition and Feedback Logic

During command mode, recognized text is normalized and matched against the command map to decide which action to execute. During practice mode, the app first checks for an exact normalized sentence match, then falls back to a simple word-overlap score to determine whether the learner passed with a strong enough match. 

The score logic increments the visible counter when the learner either matches the sentence exactly or reaches at least 70 percent word overlap with the target sentence. Spoken feedback is then provided with browser TTS, and the app returns to command mode after a successful attempt. 

## UI Summary

The interface is a single-page dark theme layout with a central app container, stacked information panels, and a two-column grid of action buttons. The visible UI surfaces focus on four core areas: current status, target sentence, live transcript, and count value.  

## Browser and Platform Notes

The project depends on the browser’s Web Speech API implementation, including speech recognition and speech synthesis support. Because `SpeechRecognition` support is not consistent across browsers, the current code explicitly advises using Chrome when the API is unavailable.    

## Known Gaps

- The attached codebase reflects an earlier button-driven command flow rather than the newer wake-word and intent-first interaction discussed later. 
- The current layout is wider than an iPhone 8-optimized mobile UI and still uses a general `max-width: 720px` container rather than a compact 375px-first layout. 
- Pattern data appears both in `app.js` and `patterns.js`, so the project would benefit from consolidating sentence data into one source of truth.  
- The recognition loop uses `continuous = true`, which may be less stable than shorter repeated sessions in some browser environments.  

## Suggested Next Refactor

A practical next step is to refactor the project into a voice-first intent model centered on a wake phrase such as `drill`, followed by short commands like `next`, `again`, `read target`, and `start practice`. In parallel, the UI can be compressed into an iPhone 8-friendly one-screen layout with a single voice toggle, current target card, transcript panel, and compact status strip.   

## How to Run

1. Open `index.html` in a browser that supports the Web Speech API, preferably Chrome.  
2. Allow microphone access when prompted.[9]
3. Press the listen button to begin speech recognition. 
4. Say one of the supported commands such as `start`, `backward`, `have a go`, `next`, or `reset`. 
5. Use the on-screen buttons as fallback controls if speech recognition is unavailable or inconsistent.  
