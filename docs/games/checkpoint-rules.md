# ผู้ตรวจการ — Game Design Draft v0.2

> Working title for an original TangWong bluffing and negotiation game.
> This design uses original names, theme, content, interface, and rules.

## Product Fit

- Players: 3–6
- Play time: 25–40 minutes
- Format: mobile-first online multiplayer
- Core emotions: suspicion, persuasion, opportunism, shared laughter
- Platform systems exercised: private hands, simultaneous choices, timed chat,
  sealed offers, rotating authority, inventory, scoring, bots, reconnection

## Fantasy

At the last gate before a neon night market, travelling merchants try to move
valuable cargo into the city. Some goods are legal and safe to declare. Illegal
goods are worth much more, but they are confiscated when an inspection finds
them.
Every shift, one player becomes the Gatekeeper and must decide who is honest,
who is bluffing, and which offer is worth accepting.

The other merchants are never passive: they can spend one Rumor token per shift
to accuse a rival and earn a reward when their information proves correct.

## Design Pillars

1. **Conversation is the board** — negotiation should matter more than card math.
2. **Everyone acts every shift** — rumors keep uninvolved merchants engaged.
3. **The Gatekeeper cannot inspect everyone** — inspection seals create a real
   resource decision instead of making inspection the default answer.
4. **Short, legible mobile turns** — each phase has one obvious primary action.
5. **Deals are binding when the system can enforce them** — no rules arguments
   about whether a promised payment was actually made.

## Components

### Goods

Goods have only two statuses: **Legal** and **Illegal**. There are no ambiguous
licensed, restricted, Produce, or Craft categories.

#### Legal Goods — สินค้าถูกกฎหมาย

Legal goods may be named in a declaration. They are common and lower-value.

| Good | Value | Penalty when falsely declared |
|---|---:|---:|
| ข้าว (Rice) | 2 บาท | 1 บาท |
| แอปเปิล (Apple) | 2 บาท | 1 บาท |
| เครื่องเทศ (Spice) | 3 บาท | 1 บาท |
| ผ้าไหม (Silk) | 3 บาท | 1 บาท |
| ยารักษาโรค (Medicine) | 4 บาท | 2 บาท |

#### Illegal Goods — สินค้าผิดกฎหมาย

Illegal goods cannot be named in a declaration. They are much more valuable,
but inspection confiscates them and charges a larger fine.

| Good | Value | Inspection penalty |
|---|---:|---:|
| เอกสารปลอม (Forged Documents) | 6 บาท | 3 บาท |
| อัญมณีโจรกรรม (Stolen Gems) | 7 บาท | 3 บาท |
| ปืนเถื่อน (Illegal Gun) | 8 บาท | 4 บาท |
| ธนบัตรปลอม (Counterfeit Money) | 9 บาท | 5 บาท |

Initial playtest deck: 8 copies of every Legal good and 4 copies of every
Illegal good, for 56 cards total. Values and card counts are balance targets,
not final production numbers.

### Player Resources

- 20 starting baht
- 6 cards in hand
- 1 Rumor token per shift
- 1 private Contract chosen from 2 options at game start

### Shared Resources

- Goods deck and discard pile
- Market demand card for the current shift
- Inspection seals held by the Gatekeeper
- Public delivered-goods areas for every player

## Setup

1. Randomize the first Gatekeeper.
2. Give every player 20 baht and 6 Goods cards.
3. Deal 2 private Contracts to each player; they keep 1.
4. Reveal the first Market demand card.
5. Give the Gatekeeper inspection seals:
   - 3 players: 1 seal
   - 4–6 players: 2 seals

## Shift Structure

One shift contains five phases.

### 1. Pack

Every merchant simultaneously places 1–3 Goods cards into a private crate.

Then each merchant declares:

- one exact Legal good name
- the number of cards in the crate

The count must be truthful. The declared good name may be a bluff. Illegal goods
can never be declared directly.

Example: a crate containing Apple, Illegal Gun, and Counterfeit Money may be
declared as “Apple ×3”. The count is true, but two cards do not match the named
Legal good.

### 2. Negotiate

The Gatekeeper sees every merchant's declaration and public delivered goods.

Each merchant creates one final sealed offer containing 0–5 baht. The offer is
paid automatically only if the Gatekeeper chooses **Pass**. Once submitted, the
offer cannot be changed during the current shift.

Every non-Gatekeeper may also spend one Rumor token to accuse another merchant.
Rumors are public and cannot be withdrawn.

### 3. Decide

The Gatekeeper resolves merchants in any order:

- **Pass** — consume no seal; deliver the entire crate and collect the sealed
  offer from that merchant.
- **Inspect** — consume one inspection seal and reveal the crate.

When no inspection seals remain, unresolved merchants must be passed.

### 4. Reveal and Settle

If every card in an inspected crate exactly matches the declared Legal good:

- all goods are delivered
- the sealed offer is cancelled
- the Gatekeeper pays the merchant compensation equal to the card count

If an inspected crate contains any other Legal good or any Illegal good:

- cards matching the declared Legal good are delivered
- all mismatched Legal and Illegal goods are confiscated and discarded
- the merchant pays their printed inspection penalties to the Gatekeeper
- the sealed offer is cancelled

### 5. Market Close

1. Resolve Rumors:
   - correct accusation against a bluffing merchant: accuser gains 2 baht
   - incorrect accusation against a truthful merchant: accuser loses 1 baht
   - uninspected or passed target: no reward or penalty
2. Apply the current Market demand bonus to delivered goods.
3. Merchants draw back to 6 cards.
4. Rotate the Gatekeeper clockwise and reveal a new Market demand card.

## Game Length

The game always lasts exactly **two full rotations**. Every player becomes the
Gatekeeper twice, so a game with 5 players has 10 shifts. This fixed second
rotation gives players time to retaliate, honor earlier deals, or form new
alliances after seeing how the table behaved in the first rotation.

## Market Demand

One demand is active each shift and is visible before packing.

Initial set:

- Rice Shortage — Rice gains +1 value this shift
- Apple Fair — the first Apple delivered by each merchant gains +1 value
- Silk Festival — Silk gains +2 value this shift
- Medical Drive — Medicine gains +2 value this shift
- Weapons Crackdown — Illegal Gun inspection penalties increase by 2 baht
- Counterfeit Alert — Counterfeit Money inspection penalties increase by 2 baht
- Honest Trade — truthful inspected crates gain 1 extra baht

## Contracts

Contracts provide private end-game objectives worth 4–7 baht.

Initial examples:

- Rice Merchant — deliver 4 Rice
- Silk Road — deliver 3 Silk
- Diverse Cargo — deliver at least one good from four different names
- Arms Dealer — deliver 2 Illegal Guns
- Master Forger — deliver 2 Counterfeit Money
- Clean Record — finish with no confiscated Illegal goods

## Game End

- The game ends after every player has been Gatekeeper exactly twice.
- Total shifts are always `player count × 2`.

Final score:

Current playable vertical slice:

`remaining baht + delivered Goods value`

Target after the balance pass:

`remaining baht + delivered Goods value + Market bonuses + completed Contract value`

Highest score wins. Ties break by:

1. most delivered Legal goods
2. most remaining baht
3. shared victory

## What Makes It Distinct

- Inspection is limited by seals, so the Gatekeeper must prioritize.
- Every merchant can influence the decision through one public Rumor.
- Sealed offers are private, final once submitted, and enforced by the game engine.
- Demand cards change Legal values and Illegal inspection risk before packing.
- Private Contracts create motives that cannot be inferred from raw card value.

## Information Model

### Public State

- phase, shift, timer, Gatekeeper
- declarations
- public Rumors
- remaining inspection seals
- pass/inspect decisions
- revealed inspected crates
- delivered goods, baht, demand card, score summary

### Private Player State

- hand
- packed crate before reveal
- sealed offer amount
- private Contract

### Server-only State

- full deck and draw order
- unresolved packed crates
- bot intent and negotiation persona

## Action Model

- `SUBMIT_CRATE`
- `SUBMIT_OFFER`
- `PLACE_RUMOR`
- `PASS_MERCHANT`
- `INSPECT_MERCHANT`
- `CONTINUE_SHIFT`

## Phase State Machine

```text
setup
  -> pack
  -> negotiate
  -> decide
  -> shiftResult
  -> pack (next Gatekeeper)
  -> gameEnd
```

## Mobile UI Direction

### Persistent Header

- shift and Gatekeeper identity
- demand card
- player's baht total
- chat icon with unread count

### Merchant View

- three fixed crate slots
- horizontally scrollable private hand
- exact Legal-good selector and count stepper
- sealed-offer control during negotiation
- one bottom CTA: `Seal crate` or `Update offer`

### Gatekeeper View

- queue of merchant rows, not a decorative player ring
- declaration and Rumor count visible at a glance
- selected merchant expands inline with their sealed offer
- two explicit commands: `Pass` and `Inspect`
- remaining seals stay visible beside the phase timer

### Reveal View

- crate opens in place
- goods reveal together rather than one-by-one
- settlement shows delivered, confiscated, and baht transfer in one summary

## First Playtest Questions

1. Are two inspection seals enough at 5–6 players?
2. Does the Rumor reward encourage participation without creating kingmaking?
3. Is truthful play economically viable without a bribe?
4. Can a full shift finish within three minutes?
5. Do players understand that count must be truthful while category may be false?
6. Does the second Gatekeeper rotation create enough revenge and deal-making to justify the extra play time?

## Playable Vertical Slice Status

Implemented on 2026-07-13:

- complete two-rotation state machine
- private 1–3 card crates and exact-count declarations
- final sealed offers and one public Rumor per merchant per shift
- limited Pass/Inspect decisions, compensation, confiscation, and penalties
- bot merchants and bot Gatekeepers
- cash + delivered-goods scoring and result ranking

Deferred to the balance pass:

- finite shared draw pile and discard pile
- Market demand cards
- private Contracts and contract score
- phase timers and timeout defaults
