# Qualification Flow (Renovation Niche)

## Design principles

1. **Structured BANT via buttons, not free text.** Interactive WhatsApp buttons and lists give 100% reliable answers. Claude Haiku is only used for conversational glue and off-script handling.
2. **4 questions, max 2 minutes.** Any longer and dropoff spikes. Property type → Ownership → Budget → Timeline.
3. **Hard-fail renters early.** Saves a question and ends politely.
4. **Never promise prices.** Defer all pricing to the human consultant.
5. **Keep every message under 300 characters.** WA renders long text poorly on mobile.

## Conversation turns

### Turn 0 — Welcome
On lead ingestion:
> Hi {name}! 👋 Thanks for your enquiry about renovation. I'm Ava — I'll help you quickly so we can connect you with the right contractor. Just a few quick questions, should take 2 minutes.

### Turn 1 — Property type (interactive list)
```
Body: What type of property is the renovation for?
Button: Select property
Sections:
  HDB: [HDB 3-room] [HDB 4-room] [HDB 5-room / Exec]
  Private: [EC] [Condo] [Landed]
```

### Turn 2 — Ownership (interactive buttons)
```
Body: Are you the owner of the property, or currently renting?
Buttons: [I own it] [I rent]
```

If `rent` → Disqualified + farewell.

### Turn 3 — Budget (interactive list)
```
Body: What's your rough budget for the renovation?
Button: Select budget
Sections:
  Budget range:
    [Under $10k — Small touch-ups]
    [$10k - $30k — Partial reno]
    [$30k - $60k — Standard full reno]
    [$60k and above — Premium / full custom]
```

### Turn 4 — Timeline (interactive buttons)
```
Body: When are you hoping to start?
Buttons: [Within 3 months] [3-6 months] [Just exploring]
```

### Turn 5 — Closing
Based on verdict:

**QUALIFIED_HOT / QUALIFIED_WARM:**
> Perfect! I've got everything I need. Our consultant for {area} will reach out within {24h/2h}. They'll discuss exact pricing based on your {property_type} layout. Talk soon! 🙂

**NURTURE:**
> Thanks for sharing! Since you're still exploring, I'll send you our portfolio and tips over the next week — no pressure. If your plans firm up, just reply "ready" anytime.

**DISQUALIFIED (renter):**
> Thanks! Unfortunately we only work with property owners. All the best with your search!

## Scoring weights

| Component | Max | Source |
|---|---|---|
| Ownership (mandatory) | 25 | Button reply |
| Has budget | 20 | List reply (any selection) |
| Has timeline | 15 | Button reply (any selection) |
| Budget size bonus | 25 | List reply value |
| Timeline urgency bonus | 15 | Button reply value |
| **Total** | **100** | |

### Budget size points
- Under $10k → 5
- $10k-$30k → 15
- $30k-$60k → 22
- $60k+ → 25

### Timeline urgency points
- Within 3 months → 15
- 3-6 months → 10
- Just exploring → 3

### Verdict thresholds
- ≥ 75 → `QUALIFIED_HOT`
- 55-74 → `QUALIFIED_WARM`
- 35-54 → `NURTURE`
- < 35 or renter → `DISQUALIFIED`

## Expected distribution (from industry benchmarks)

| Verdict | Typical % | Action |
|---|---|---|
| QUALIFIED_HOT | ~15% | Immediate priority assignment, client WA in 2 minutes |
| QUALIFIED_WARM | ~20% | Standard assignment within 4 hours |
| NURTURE | ~35% | 14-day drip sequence (M3) |
| DISQUALIFIED | ~30% | Archived, not billed |

## Tuning plan

Thresholds are initial guesses. After ~50 real leads in pilot:

1. Manually review every AI conversation and verdict
2. Compare: did HOT leads actually close? Did NURTURE leads recover?
3. Adjust weights in `backend/app/qualification/scoring.py`
4. Re-run on historical leads to validate
5. Deploy tuned thresholds
