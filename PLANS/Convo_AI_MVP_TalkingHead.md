# Virtual Room MVP — TalkingHead Implementation Plan

**Date:** 2026-03-21
**Core Library:** TalkingHead v1.7+ (`avatarOnly` mode)
**Purpose:** Two 3D avatars (Alice & John) sitting in a shared virtual room, controllable via a simple JSON API to make either one speak.

---

## 1. What We're Building (Exactly)

```
┌────────────────────────────────────────────────────────────┐
│                  BROWSER — Virtual Room                     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Three.js 3D Scene                       │  │
│   │                                                      │  │
│   │      ┌─────────┐            ┌─────────┐             │  │
│   │      │  Alice   │   TABLE   │  John    │             │  │
│   │      │ (seated) │           │ (seated) │             │  │
│   │      └─────────┘            └─────────┘             │  │
│   │                                                      │  │
│   │   [ Room: desk, chairs, background, lighting ]       │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Control Panel (for testing)                         │  │
│   │  [ Speaker: Alice ▼ ] [ Type message here... ] [Send]│  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   [ Transcript: "Alice: Hello John!" ]                     │
└────────────────────────────────────────────────────────────┘

External API:
POST /api/speak
{ "speaker": "alice", "message": "Hello John, what do you think?" }

→ Alice's avatar turns to John, speaks the text with lip-sync
→ John's avatar plays idle/listening animation
→ Transcript updates
```

**What this includes:** Two avatars in one 3D scene, lip-synced speech, seated poses, eye contact between speakers, idle animations, API control.

**What this does NOT include:** LLM, auto-debate, conversation memory, user microphone input.

---

## 2. Architecture

```
                POST /api/speak
                { speaker, message }
                       │
                       ▼
              ┌─────────────────┐
              │  Next.js App     │
              │                  │
              │  API Route       │
              │  /api/speak      │◄──── Also: built-in control
              │                  │      panel UI for testing
              └────────┬────────┘
                       │ (WebSocket or direct call)
                       ▼
              ┌─────────────────────────────────────┐
              │  Browser Client (same page)          │
              │                                      │
              │  ┌────────────────────────────────┐  │
              │  │  RoomManager                    │  │
              │  │                                 │  │
              │  │  alice = TalkingHead(standalone) │  │
              │  │  john  = TalkingHead(avatarOnly)│  │
              │  │                                 │  │
              │  │  alice.speakTo = john            │  │
              │  │  john.speakTo = alice            │  │
              │  │                                 │  │
              │  │  room furniture added to         │  │
              │  │  alice.scene (shared scene)      │  │
              │  └────────────────────────────────┘  │
              │                                      │
              │  speak("alice", "Hello") →            │
              │    alice.speakText("Hello")           │
              │    (john stays idle, listening)       │
              └──────────────────────────────────────┘
              
              All rendering happens CLIENT-SIDE.
              No avatar API. No streaming costs.
              Only cost = TTS API (Google TTS free tier: 4M chars/month)
```

### Why This Architecture

- **TalkingHead handles everything client-side:** 3D rendering, lip-sync, animations, TTS integration — all in the browser via Three.js/WebGL
- **No avatar streaming API costs:** Unlike Tavus/HeyGen ($0.10-0.20/min), this renders locally
- **`avatarOnly` mode (Appendix H):** Documented feature for putting multiple avatars into ONE shared Three.js scene
- **`speakTo` property:** Built-in feature to make avatars face each other when speaking
- **Google TTS integration is built-in:** Free tier gives 4 million characters/month — enough for extensive testing and early users

---

## 3. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend framework | Next.js 14+ (TypeScript) | App router, API routes, deployment simplicity |
| 3D avatar engine | TalkingHead v1.7+ | `avatarOnly` mode, `speakTo`, built-in lip-sync, Mixamo animations |
| 3D rendering | Three.js r180 (bundled with TalkingHead) | TalkingHead's native renderer |
| TTS | Google Cloud TTS (built-in to TalkingHead) | Free 4M chars/month, word-level timestamps for lip-sync, built-in integration |
| Avatar models | Avaturn (free) or MPFB/Blender (free, open-source) or custom | RPM is dead — these are the documented alternatives |
| Room 3D model | Sketchfab / CGTrader / custom Blender | One-time purchase or creation of a meeting room GLB |
| Communication | WebSocket (native, or socket.io) | Push speak commands from API route to browser client |
| Deployment | Vercel (frontend) | Free tier handles this fine |

### TTS Choice Reasoning

TalkingHead has built-in Google TTS integration with lip-sync. This is the path of least resistance. Later, you can swap to ElevenLabs (also supported via `speakAudio`) for higher voice quality — but Google TTS is free and works out of the box.

---

## 4. The Core Pattern: Two Avatars in One Scene

This is the critical code. Directly from TalkingHead Appendix H, adapted for your use case:

```javascript
import { TalkingHead } from "talkinghead";

let alice, john;
const container = document.getElementById('room');

// ─── ALICE: Standalone instance (owns the 3D scene) ───
alice = new TalkingHead(container, {
  ttsEndpoint: "/api/tts-proxy",       // Your Google TTS proxy
  lipsyncModules: ["en"],
  cameraView: "mid",                   // Mid-body shot of the room
  cameraDistance: 0.5,                  // Pull back to see both
  // This callback updates John every frame inside Alice's render loop
  update: (dt) => { john?.animate(dt); }
});

await alice.showAvatar({
  url: '/avatars/alice.glb',           // Your avatar GLB file
  body: 'F',
  avatarMood: 'neutral',
  ttsLang: "en-US",
  ttsVoice: "en-US-Standard-F",       // Female voice
  lipsyncLang: 'en'
});

// ─── JOHN: avatarOnly instance (no own scene, joins Alice's) ───
john = new TalkingHead(container, {
  ttsEndpoint: "/api/tts-proxy",
  lipsyncModules: ["en"],
  avatarOnly: true,                    // KEY: no own scene
  avatarOnlyCamera: alice.camera       // Uses Alice's camera
});

await john.showAvatar({
  url: '/avatars/john.glb',
  body: 'M',
  avatarMood: 'neutral',
  ttsLang: "en-US",
  ttsVoice: "en-US-Standard-B",       // Male voice (different from Alice)
  lipsyncLang: 'en'
});

// ─── POSITION JOHN IN THE SHARED SCENE ───
john.armature.position.set(1.2, 0, 0);       // 1.2m to Alice's right
john.armature.rotation.set(0, -0.5, 0);      // Angled toward Alice
alice.scene.add(john.armature);               // Add to shared scene

// ─── MAKE THEM FACE EACH OTHER ───
alice.speakTo = john;    // Alice looks at John when speaking
john.speakTo = alice;    // John looks at Alice when speaking

// ─── ADD ROOM FURNITURE TO THE SHARED SCENE ───
// Load a GLB room model (table, chairs, background)
const loader = new THREE.GLTFLoader();  // or use Three.js built-in
const roomGLTF = await loader.loadAsync('/models/meeting-room.glb');
alice.scene.add(roomGLTF.scene);

// ─── THE SPEAK FUNCTION ───
function speak(speaker, message) {
  if (speaker === 'alice') {
    alice.speakText(message);
  } else if (speaker === 'john') {
    john.speakText(message);
  }
}

// Usage:
speak("alice", "What do you think about remote work culture, John?");
// After Alice finishes, call:
speak("john", "I think it requires intentional communication practices.");
```

**What this gives you for free from TalkingHead:**
- Lip-synced speech for each avatar independently
- Eye contact / head turning toward the other avatar via `speakTo`
- Idle animations (blinking, breathing, subtle movement) on the non-speaking avatar
- Facial expressions via mood system (`setMood("happy")`, etc.)
- Hand gestures via `playGesture("index", 3)` on either instance
- Both avatars share the same 3D scene, lighting, and camera

---

## 5. Seated Pose Problem & Solution

TalkingHead's default poses are standing. Your image shows seated characters. This requires defining custom seated poses using `head.poseTemplates` (documented in Appendix D).

**Approach:** Define a seated pose template with hip position lowered, legs bent at ~90°, and upper body upright. Apply it on load.

```javascript
// Define a seated pose for Alice (left side of table)
alice.poseTemplates["seated-left"] = {
  standing: false, sitting: true, bend: false, kneeling: false, lying: false,
  props: {
    'Hips.position': { x: 0, y: 0.52, z: 0 },    // Lowered for chair height
    'Hips.rotation': { x: 0.05, y: 0.3, z: 0 },   // Slightly turned toward John
    'Spine.rotation': { x: -0.1, y: 0, z: 0 },
    'Spine1.rotation': { x: -0.02, y: 0, z: 0 },
    'Spine2.rotation': { x: 0.05, y: 0, z: 0 },
    'LeftUpLeg.rotation': { x: -1.57, y: 0, z: 0.1 },    // ~90° bend
    'LeftLeg.rotation': { x: 1.4, y: 0, z: 0 },
    'RightUpLeg.rotation': { x: -1.57, y: 0, z: -0.05 },
    'RightLeg.rotation': { x: 1.5, y: 0, z: 0 },
    // ... arms resting on table, adjust per model
  }
};
alice.playPose("seated-left");
```

**Reality check:** Getting the seated pose to look natural takes iteration. The bone rotation values above are approximate starting points. Claude Code will need to tune them visually. This is the most time-consuming part of the MVP — expect 1-2 days of tweaking.

**Alternative shortcut:** Download a sitting animation from Mixamo (search "Sitting Idle"), export as FBX, and use `playAnimation()` instead of manual pose definition. Mixamo has several seated idle animations that loop naturally.

---

## 6. Avatar Sources (Post-RPM Shutdown)

RPM is dead. Here are the confirmed working alternatives, documented in TalkingHead's README:

| Source | Type | Cost | Compatibility |
|--------|------|------|--------------|
| **Avaturn** | Realistic from photo | Free (non-commercial), contact for commercial | "Avaturn Type-2 (T2) avatars are fully TalkingHead-compatible" per README |
| **MPFB + Blender** | Parametric human generator | Free, open-source (CC0/CC-BY) | Full guide in TalkingHead repo: `blender/MPFB/MPFB.md` |
| **Avatar SDK / MetaPerson** | Realistic from photo | Commercial ($) | Blender scripts provided in TalkingHead repo |
| **Microsoft RocketBox** | Pre-made character library | Free (MIT License) | Has ARKit+Oculus blendshapes, needs re-rigging in Mixamo |
| **Custom Blender model** | Any style you want | Time or hire ($2-5K) | Must have Mixamo rig + ARKit + Oculus viseme blendshapes |

**For MVP / prototyping:** Use Avaturn (free, instant) or the bundled example avatars that ship with TalkingHead (`avatars/brunette.glb`, `avatars/mpfb.glb`, `avatars/avaturn.glb`, `avatars/avatarsdk.glb`). These files are already in the repo.

**For production (your reference image style):** Commission two custom stylized characters from a 3D artist. Spec: Mixamo-compatible rig, ARKit blendshapes (52), Oculus viseme blendshapes (15). Budget $2-5K for two characters.

---

## 7. Room Environment

The 3D room (table, chairs, whiteboard, plants, window) is a separate GLB model loaded into the shared Three.js scene.

**Options:**

| Source | Cost | Notes |
|--------|------|-------|
| Sketchfab | $20-100 for a meeting room model | Huge library, search "cartoon office" or "stylized meeting room" |
| CGTrader | $20-100 | Similar to Sketchfab |
| Blender + AI assist | Free (time) | Create in Blender, or use AI tools like Meshy.ai for quick 3D generation |
| Commission | $500-2000 | Custom room matching your exact reference image |

**Requirements for the room GLB:**
- Must be exported as GLB/GLTF
- Reasonable poly count (< 500K triangles for browser performance)
- Chairs positioned where avatars will sit (align with avatar hip positions)
- Proper scale (1 unit = 1 meter, standard for Three.js)

---

## 8. Implementation Steps

### Step 1: Get TalkingHead Running with One Avatar (Day 1)

**Goal:** Single avatar speaks text in browser.

1. Clone TalkingHead repo or install via NPM (`@met4citizen/talkinghead`)
2. Set up a Next.js project
3. Create a page that loads TalkingHead with one of the bundled avatars
4. Get a Google Cloud TTS API key (free tier)
5. Make the avatar speak a test sentence via `speakText()`
6. Confirm: lip-sync works, idle animations work, gestures work

**Key reference:** `examples/minimal.html` in the TalkingHead repo — a complete working single-avatar example.

### Step 2: Add Second Avatar Using `avatarOnly` Mode (Day 2)

**Goal:** Two avatars visible in the same scene, each speaks independently.

1. Create the standalone instance (Alice) — owns the scene
2. Create the `avatarOnly` instance (John) — joins Alice's scene
3. Position John's armature offset from Alice
4. Set `alice.speakTo = john` and `john.speakTo = alice`
5. Wire up the `update` callback so John animates inside Alice's render loop
6. Test: `alice.speakText("Hello")` → Alice speaks, John idles
7. Test: `john.speakText("Hello")` → John speaks, Alice idles
8. Confirm both have different voices (different `ttsVoice` settings)

**This is the riskiest step.** The `avatarOnly` mode is marked EXPERIMENTAL. If something breaks here, file an issue on the TalkingHead GitHub. The author (met4citizen) is active and responsive.

### Step 3: Seated Poses (Day 2-3)

**Goal:** Both avatars are sitting, not standing.

**Option A (faster):** Download a "Sitting Idle" animation from Mixamo.com, load it via `playAnimation()`. Quick to test but less control.

**Option B (more control):** Define custom `poseTemplates` for seated-left and seated-right. Tune bone rotations until they look natural. More work but better result.

Test: Both avatars sit naturally. When speaking, upper body animates (head movement, lip-sync, gestures) while lower body stays seated.

### Step 4: Add Room Environment (Day 3)

**Goal:** Avatars are inside a 3D room, not floating in void.

1. Source or create a meeting room GLB model
2. Load it into the shared scene: `alice.scene.add(roomModel.scene)`
3. Adjust positions: align avatar hip positions with chairs in the room model
4. Adjust camera: set `cameraView`, `cameraDistance`, `cameraX`, `cameraY` so the frame shows both avatars and the room nicely
5. Adjust lighting to match room mood

### Step 5: Build the Speak API (Day 4)

**Goal:** External interface to make avatars speak.

**API Route (`/api/speak`):**
```typescript
// app/api/speak/route.ts
export async function POST(request: Request) {
  const { speaker, message } = await request.json();
  
  if (!['alice', 'john'].includes(speaker)) {
    return Response.json({ error: 'Unknown speaker' }, { status: 400 });
  }
  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message required' }, { status: 400 });
  }

  // Push to connected browser client via WebSocket
  broadcastToClients({ type: 'speak', speaker, message });
  
  return Response.json({ status: 'queued', speaker, message });
}
```

**Browser client receives WebSocket message:**
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'speak') {
    speak(data.speaker, data.message);
  }
};

function speak(speaker, message) {
  const avatar = speaker === 'alice' ? alice : john;
  avatar.speakText(message);
}
```

**For MVP simplicity:** Skip WebSocket entirely. Put the control panel directly in the browser page. The API route is optional — the in-page control panel calls `speak()` directly. Add the API route later when you need external systems to trigger speech.

### Step 6: Control Panel + Transcript (Day 4-5)

**Goal:** In-page UI for testing.

1. Dropdown: select "Alice" or "John"
2. Text input: type the message
3. Send button: triggers `speak(speaker, message)`
4. Transcript panel: appends `"Alice: Hello John!"` each time someone speaks
5. Use TalkingHead's `onsubtitles` callback to sync transcript with actual speech timing

### Step 7: Polish (Day 5-7)

1. **Listening behavior:** When Alice speaks, trigger a subtle nod or head tilt on John. Use `john.playGesture()` or custom mood animations
2. **Mood matching:** Set mood based on message sentiment — `alice.setMood("happy")` before positive messages
3. **Camera tweaks:** Find the best angle that shows both avatars and the room
4. **Loading screen:** Avatar GLB files take a few seconds to load — show a progress bar
5. **Error handling:** Graceful fallback if TTS fails or avatar fails to load

---

## 9. File Structure

```
/virtual-room/
├── app/
│   ├── page.tsx                    # Main room page
│   ├── layout.tsx                  # Root layout
│   └── api/
│       ├── speak/route.ts          # POST /api/speak endpoint
│       └── tts-proxy/route.ts      # Proxy to Google TTS (hides API key)
│
├── components/
│   ├── VirtualRoom.tsx             # Main component — initializes TalkingHead
│   ├── ControlPanel.tsx            # Speaker selector + text input + send
│   └── Transcript.tsx              # Running log of spoken messages
│
├── lib/
│   ├── room-manager.ts             # Creates both TalkingHead instances,
│   │                               # positions them, sets speakTo,
│   │                               # loads room model, exposes speak()
│   ├── poses.ts                    # Custom seated pose templates
│   └── ws.ts                       # WebSocket client (optional)
│
├── public/
│   ├── avatars/
│   │   ├── alice.glb               # Alice's 3D avatar model
│   │   └── john.glb                # John's 3D avatar model
│   ├── models/
│   │   └── meeting-room.glb        # 3D room environment
│   └── animations/
│       └── sitting-idle.fbx        # Mixamo seated animation (optional)
│
├── package.json
└── .env.local                      # GOOGLE_TTS_API_KEY
```

---

## 10. Cost Breakdown

### Build Cost

| Item | Cost |
|------|------|
| TalkingHead library | Free (MIT license) |
| Google TTS API key | Free (4M chars/month on free tier) |
| Prototype avatars (bundled in TalkingHead) | Free |
| Meeting room 3D model (Sketchfab) | $20-80 |
| Mixamo sitting animation | Free |
| Next.js + Vercel deployment | Free tier |
| **Total to prototype** | **$20-80** |

### Production Upgrade Cost

| Item | Cost |
|------|------|
| Two custom stylized characters (3D artist) | $2,000-5,000 |
| Custom room environment (3D artist) | $500-2,000 |
| ElevenLabs TTS (better voices) | $5-22/month |
| **Total for polished product** | **$2,500-7,000 one-time + $5-22/month** |

### Per-Session Running Cost (Production)

| Component | Cost per 30-min session |
|-----------|------------------------|
| Google TTS (free tier) | $0.00 |
| Google TTS (paid, if over free tier) | ~$0.50-1.00 |
| ElevenLabs (if upgraded) | ~$0.50-1.50 |
| 3D rendering | $0.00 (client-side) |
| Hosting (Vercel) | $0.00 (free tier) |
| **Total per session** | **$0.00-1.50** |

Compare this to the avatar API approach: $7-16 per session. This is 10-100x cheaper.

---

## 11. What "Experimental" Means — Risk Assessment

The `avatarOnly` mode is marked **EXPERIMENTAL** in TalkingHead v1.7.0. Here's what that means practically:

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `avatarOnly` mode has bugs with two avatars | Medium | Medium | The feature was added specifically for multi-avatar. DialogLab (Google Research) uses TalkingHead for multi-avatar. Author is active. File issues. |
| Audio conflict between two TalkingHead instances | Medium | Medium | Both instances share the same AudioContext. Test early. If issues, only one speaks at a time (which is your use case anyway). |
| Seated pose looks unnatural | Low | High | Expected — requires manual tuning. Use Mixamo sitting animation as a starting point. Budget 1-2 days for this. |
| Performance issues with two avatars + room in browser | Low | Low | TalkingHead runs at 30fps by default. Two avatars ≈ double the blend shape updates. Modern browsers handle this fine. |
| Google TTS free tier runs out | Low | Low | 4M chars/month is a LOT. If you hit it, upgrade ($4/1M chars) or switch to ElevenLabs. |
| Avaturn or alternative avatar source changes terms | Low | Low | For production, commission custom models. No dependency on any avatar platform. |

**The biggest real risk:** The seated pose tuning. Everything else has documented code paths. The pose work is manual, iterative, and can't be fully automated.

---

## 12. What This MVP Proves

Once working, you've validated:

1. Two 3D avatars can exist and speak independently in one shared browser scene
2. External text input drives specific avatar speech with natural lip-sync
3. Avatars look at each other when speaking (via `speakTo`)
4. The visual quality is acceptable for your product concept
5. Running cost per session is near-zero (no avatar API dependency)
6. The entire experience runs client-side in the browser

**From here, the next layers are:**
- LLM orchestrator to auto-generate debate dialogue
- Turn-taking logic (who speaks next)
- User voice input (STT → inject into conversation)
- Better character models and room design
- Gesture triggering based on speech content

---

## 13. Key Reference Links

| Resource | URL |
|----------|-----|
| TalkingHead GitHub (main) | https://github.com/met4citizen/TalkingHead |
| TalkingHead NPM package | https://www.npmjs.com/package/@met4citizen/talkinghead |
| TalkingHead CDN (v1.7) | `https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.7/modules/talkinghead.mjs` |
| Minimal example (single avatar) | https://github.com/met4citizen/TalkingHead/blob/main/examples/minimal.html |
| Appendix H: avatarOnly mode | In README, section "Appendix H: Avatar-Only Mode" |
| Appendix D: Custom poses/gestures | In README, section "Appendix D" |
| DialogLab (Google, multi-avatar reference) | https://github.com/ecruhue/DialogLab |
| Avaturn (avatar creation, RPM alternative) | https://avaturn.me |
| MPFB + Blender (free avatar creation) | https://static.makehumancommunity.org/mpfb.html |
| MPFB with TalkingHead guide | https://github.com/met4citizen/TalkingHead/blob/main/blender/MPFB/MPFB.md |
| Microsoft RocketBox (free avatar library) | https://github.com/microsoft/Microsoft-Rocketbox |
| Mixamo (free animations) | https://www.mixamo.com |
| Google Cloud TTS | https://cloud.google.com/text-to-speech |
| ElevenLabs (premium TTS option) | https://elevenlabs.io |
| Three.js | https://threejs.org |
| Sketchfab (3D room models) | https://sketchfab.com |

---

*Estimated time from zero to working two-avatar room: 5-7 working days.*
*Estimated cost to prototype: $20-80.*
*Estimated per-session running cost: $0-1.50.*
