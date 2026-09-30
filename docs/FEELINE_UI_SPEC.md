# FeELINE UI Specification

## Purpose and Reference Hierarchy

This document defines the frontend UI and interaction requirements for FeELINE, a mobile academic prototype for recognizing observable emotional cues in Puspin cats from images.

The primary visual and interaction reference is the FeELINE high-fidelity prototype :codex-file-citation{path="C:\Users\admin\.codex\.chatgpt-projects\g-p-6aacd4e8c55481919702d13e3fac74c4\sources\FeELINE_High_Fidelity_Prototype.pdf" purpose="source"}. The thesis manuscript provides supporting context for the research purpose, four emotion categories, terminology, intended functionality, and non-diagnostic framing :codex-file-citation{path="C:\Users\admin\.codex\.chatgpt-projects\g-p-6aacd4e8c55481919702d13e3fac74c4\sources\FeELINE_Thesis_Manuscript.pdf" purpose="source"}.

When implementation details are ambiguous, use this priority order:

1. Prototype intent
2. FeELINE visual identity
3. UX clarity
4. Consistency
5. Accessibility
6. Standard mobile conventions
7. Limited creative refinement

The target is prototype fidelity with tasteful professional refinement, not a redesign.

### Requirement interpretation

The prototype establishes the application’s visual identity, screen hierarchy, major layouts, navigation, and core interaction flows. These decisions should be preserved.

This specification also includes implementation guidance where the prototype does not define an exact value or behavior. Unless an exact detail is clearly established by the prototype or explicitly required here:

- Numerical values should be treated as recommended defaults.
- Control placement should follow the prototype’s visual relationship without requiring mechanical pixel reproduction.
- Grid counts may adapt when necessary for different mobile widths while preserving the prototype’s composition.
- Spacing, radii, typography sizes, and modal dimensions may be refined within the centralized design system.
- Transitions should use the most natural platform-compatible treatment consistent with FeELINE.
- Ambiguous details should be resolved using the simplest solution that preserves the existing visual language and user journey.

The terms **Preserve**, **Refine**, and **Clarify** guide implementation decisions:

- **Preserve:** Follow an established prototype decision closely.
- **Refine:** Keep the same design and flow while making a small visual or usability improvement.
- **Clarify:** Preserve the functionality while improving hierarchy, labeling, feedback, or interaction clarity.

---

## 1. Global Design Language

### Visual personality

FeELINE should feel:

- Calm
- Warm
- Cozy
- Friendly
- Approachable
- Minimal
- Polished
- Reassuring without feeling clinical
- Suitable for an academic research prototype while remaining understandable to ordinary cat owners

The interface should use generous breathing room, rounded forms, warm surfaces, friendly imagery, and clear language. Information should feel supportive rather than diagnostic.

### Design principles

- Preserve the prototype’s recognizable visual identity.
- Keep each screen focused on one primary task.
- Use progressive disclosure for secondary actions and details.
- Prefer clear labels over unexplained icons.
- Use consistent cards, buttons, dialogs, inputs, and navigation treatments.
- Keep destructive actions visually distinct but not alarming.
- Present mock results as interpretations of observable emotional cues, not as definitive knowledge of a cat’s internal emotional state.
- Avoid unnecessary animation, decoration, or dense technical information.
- Make common actions easy to reach and understand.
- Keep the interface visually coherent across Camera, Albums, Calendar, My Cats, and Settings.
- Allow small refinements when they produce clearer hierarchy, stronger accessibility, or more natural mobile interaction.

### Intended experience

A user should be able to:

1. Enter the mock authenticated application.
2. Capture or select a mock cat image.
3. Receive a clearly identified mock interpretation of observable emotional cues.
4. Save the image to an existing cat or Unknown Cats.
5. Browse saved images by album.
6. Review detection history through the calendar.
7. Manage cat profiles.
8. Read project information, policies, and disclaimers.

### Avoid

The interface must not feel:

- Medical or diagnostic
- Clinical or hospital-like
- Aggressive
- Highly technical
- Corporate
- Futuristic
- Visually crowded
- Childish
- Excessively cartoonish
- Centered on heartbeats, health monitoring, or medical dashboards
- Dependent on excessive animation or novelty effects

---

## 2. Design Tokens

All reusable values should be centralized in the theme system. Screens and components should not introduce repeated hard-coded colors, spacing values, or radii when an appropriate token exists.

The values below are recommended implementation defaults based on the existing prototype and theme direction. The main background and approved emotion directions are requirements; other precise values may be adjusted slightly if needed to improve consistency or accessibility without changing the visual identity.

### Color tokens

#### Core surfaces

| Token | Recommended value | Usage |
|---|---:|---|
| Background | `#FFF7E9` | Primary application background |
| Surface | `#FFFFFF` | Cards, sheets, dialogs, and inputs |
| Card | `#FFFFFF` | Elevated content groups |
| Overlay | `rgba(59, 42, 32, 0.45)` | Modal and dialog scrim |
| Border | `#EFE1CE` | Input, card, and control borders |
| Divider | `#F1E4D2` | List and section separators |

The primary background color `#FFF7E9` is established and should be preserved.

#### Text

| Token | Recommended value | Usage |
|---|---:|---|
| Primary text | `#3B2A20` | Headings, important labels, controls |
| Secondary text | `#8A7A6B` | Supporting copy and descriptions |
| Muted text | `#B5A797` | Captions, metadata, placeholders |
| Inverse text | `#FFFFFF` | Text over dark or colored surfaces |

Text colors may be adjusted slightly if contrast testing shows that a refinement is necessary, but the warm brown direction should remain.

#### Brand and semantic colors

| Token | Recommended value | Usage |
|---|---:|---|
| Primary peach | `#FDAC76` | Selected states, highlights, subtle accents |
| Primary dark | `#F3924F` | Stronger peach emphasis or pressed state |
| Accent blue | `#9EC7DE` | Secondary friendly accent |
| Success | `#7BB88E` | Save and submission confirmation |
| Danger | `#E2543F` | Delete actions and destructive emphasis |
| Danger soft | `#FBE2DD` | Destructive icon backgrounds |

Semantic colors should remain restrained and compatible with the warm prototype palette.

### Emotion colors

The emotion palette must follow the latest approved FeELINE direction.

| Emotion | Direction | Recommended implementation token |
|---|---|---:|
| Neutral | Preserve the warm neutral prototype direction | `#FEDEA1` |
| Happy | Soft green | `#A8D8B9` |
| Fearful | Soft violet | `#B7A6D9` |
| Angry | Warm, approachable red | `#E97866` |

The exact Happy, Fearful, and Angry values are recommended defaults because the latest direction defines their character rather than precise hex values. They should remain centralized and easy to adjust after visual review.

Do not introduce unrelated saturated colors. Emotion meaning must never rely on color alone. Pair each color with an emotion label and recognizable icon or approved cat-expression asset.

### Typography

Use a friendly rounded sans-serif treatment consistent with the prototype. If the exact prototype typeface is unavailable, use a clean system-compatible sans-serif with similar proportions rather than introducing a visually unrelated display font.

The following scale is implementation guidance, not a rigid pixel requirement:

| Style | Recommended size | Recommended weight | Usage |
|---|---:|---:|---|
| Display | Around 38–40 | Bold | FeELINE title and major branded moments |
| Page heading | Around 26–28 | Bold | Primary screen titles |
| Section heading | Around 19–21 | Semibold | Cards and grouped content |
| Body | Around 15–16 | Regular | Main readable content |
| Body medium | Around 15–16 | Semibold | Important labels |
| Button | Around 15–16 | Bold | Primary and secondary actions |
| Label | Around 13–14 | Medium | Inputs, filters, compact controls |
| Caption | Around 12–13 | Regular | Metadata and supporting information |

Exact sizes may be refined to match the chosen font and mobile scaling behavior. Preserve a clear hierarchy and comfortable line height.

Policy and About content should use a readable body line height, generally around 1.4 to 1.5 times the font size. Avoid excessive letter spacing. Moderate spacing may be used for uppercase emotion labels where shown in the prototype.

### Spacing

Use a consistent 4-point-based scale as a recommended foundation:

| Token | Recommended value |
|---|---:|
| XXS | 4 |
| XS | 8 |
| SM | 12 |
| MD | 16 |
| LG | 24 |
| XL | 32 |
| XXL | 48 |

These values are design-system defaults rather than fixed dimensions for every screen.

Use comfortable horizontal page padding appropriate to the device width. Approximately 20 to 24 pixels is a reasonable default on standard phones. Compact controls may use smaller internal spacing.

Scrollable root screens must reserve sufficient bottom space so content is not hidden behind the floating tab bar.

### Corner radii

| Token | Recommended value | Usage |
|---|---:|---|
| Small | Around 8 | Compact elements |
| Medium | Around 12 | Inputs and image tiles |
| Large | Around 18–20 | Cards and panels |
| Extra large | Around 26–28 | Sheets and prominent result cards |
| Pill | Fully rounded | Buttons, filters, avatars, tab bar |

Exact radii may be refined for visual consistency. The established rounded FeELINE character must remain.

### Shadows and elevation

- Use soft, warm-neutral shadows.
- Cards should have low elevation and subtle separation.
- Floating navigation, sheets, and prominent modals may use stronger elevation.
- Avoid dark or sharply defined shadows.
- Do not apply shadows to every element.
- Platform-specific elevation may be used as long as the visual result remains consistent.

### Icons

- Use rounded, simple line icons.
- Keep stroke weight visually consistent.
- Pair ambiguous icons with labels.
- Use filled or colored icon states only for selection and emphasis.
- Avoid medical symbols unless directly required by approved content.
- Decorative paw and cat motifs should remain restrained.

### Input fields

- Use a white or very light surface.
- Use a subtle warm border.
- Preserve the prototype’s rounded input treatment.
- Use a pill-like shape for compact single-line fields where it remains readable.
- Use a larger rounded rectangle for multiline fields.
- Show a visible label above the field.
- Use muted placeholder text.
- Provide a clear focus treatment using an existing accent.
- Place error text close to the relevant field or form group.
- Ensure inputs remain comfortable to tap, with approximately 44 pixels as a recommended minimum height.

### Modals

- Use a warm translucent overlay.
- Use a white rounded card or bottom sheet consistent with the interaction.
- Keep titles concise.
- Center titles where the prototype does so; use natural alignment when content requires it.
- Place destructive actions consistently.
- Keep Cancel available for destructive confirmations.
- Use single-action dialogs for success acknowledgements where shown by the prototype.
- Avoid stacking multiple visible modals.
- Modal sizing should adapt to content and device height rather than following a fixed universal dimension.

---

## 3. Navigation Architecture

### Root structure

FeELINE consists of:

1. Splash
2. Login
3. Authenticated application
4. Deep and detail routes
5. Temporary modal interactions

This hierarchy is established by the prototype and should be preserved.

### Authenticated tabs

The application must retain the five-tab floating bottom navigation:

1. Camera
2. Cat Album
3. Calendar
4. My Cats
5. Settings

The navigation appears as a floating rounded pill near the bottom safe area, following the prototype’s visual relationship to the screen edge.

### Screens that show bottom navigation

Show the floating tab bar on the root tab screens:

- Camera
- Cat Album
- Calendar
- My Cats
- Settings

### Screens that hide bottom navigation

Hide the floating tab bar on focused flows and detail screens:

- Emotion result
- Save/Choose Cat
- Individual album
- Single photo
- Cat profile
- About FeELINE
- Feedback
- Privacy Policy
- Terms and Conditions

If a future implementation detail creates ambiguity, favor hiding the tab bar when it competes with the hierarchy or bottom actions of a focused detail screen.

### Back behavior

- Deep screens use a visible top-left back button.
- Back returns to the immediate logical parent.
- Android system back should produce the same logical result.
- Selection mode consumes Back first by exiting selection mode.
- An open modal closes before leaving the underlying screen.
- After successful logout, users return to Login and must not navigate back into authenticated screens.

### Modal behavior

Use modals or sheets for temporary interactions such as:

- Confirmation
- Success acknowledgement
- New Cat Profile
- Rename
- Calendar filtering
- What to Avoid
- Lightweight contextual actions

Use routes for content-heavy screens and full workflows.

The exact choice between a centered modal and bottom sheet may follow the prototype and the amount of content. When the prototype is ambiguous, choose the most natural mobile presentation consistent with FeELINE.

### Transitions

- Use subtle platform-appropriate transitions for deep screens.
- Use a restrained fade or similarly natural transition for centered dialogs.
- Use a short slide or fade for bottom sheets.
- Avoid elaborate transitions.
- Exact durations are implementation details and should follow comfortable platform conventions.

---

## 4. Splash Screen

### Layout

- Fill the screen with `#FFF7E9`.
- Center the FeELINE four-emotion cat logo.
- Place “FeELINE” below the logo with strong but friendly typography.
- Keep the screen visually quiet.
- Respect safe areas while keeping the visual group optically centered.

The prototype establishes the centered brand presentation. Exact logo dimensions and vertical offsets may be adjusted for different device sizes.

### Logo treatment

- Use the four-cat emotion mark shown in the prototype.
- Preserve its compact grid composition.
- Do not surround it with an additional decorative container unless needed for contrast or asset quality.

### Timing and transition

- Display while initialization and mock session restoration occur.
- Avoid an unnecessarily long fixed delay.
- Use a subtle transition into Login or the authenticated application.
- Do not add onboarding pages or promotional content.

### Loading behavior

If initialization takes longer than expected, show a small understated activity indicator near the branded content. Do not display technical loading messages.

---

## 5. Login Screen

### Layout

Preserve the prototype’s centered hierarchy:

1. FeELINE emotion logo
2. FeELINE title
3. Supporting tagline
4. Friendly cat illustration or placeholder
5. Continue with Google button
6. Terms and Privacy acknowledgement

Use the warm application background and comfortable spacing. Exact vertical distribution may adapt to available screen height and keyboard-free safe space.

### Supporting text

Use concise wording consistent with:

> Understand your cat’s observable emotional cues using image-based analysis.

The wording may remain shorter if required by the approved prototype, but it should avoid claiming definitive knowledge of a cat’s internal emotional state.

Because the current build is a mock prototype, the interaction must not imply that a live AI or Google service is active.

### Google button

- Use a white rounded surface with subtle elevation.
- Include the Google mark on the left.
- Keep the label visually balanced.
- Allow the button to use the available content width without becoming excessively wide on large screens.
- Ensure a comfortable touch target.
- Provide a clear pressed state.
- Use a loading state during mock sign-in.
- Disable repeated taps while mock sign-in is processing.

Exact padding and icon spacing may be refined to suit the selected font and device width.

### Terms and Privacy

- Keep the acknowledgement visually secondary.
- Make “Terms” and “Privacy Policy” independently tappable where practical.
- Open the corresponding deep screens.
- Returning from either page should preserve the Login state.

---

## 6. Terms and Privacy

### Shared page structure

- Warm background
- Top back header
- Clear page title
- Vertically scrollable content
- Comfortable horizontal padding
- Readable body typography
- Consistent paragraph and section spacing

Avoid dense edge-to-edge text. Exact padding and heading sizes should follow the centralized tokens and may adapt to screen width.

### Terms content

Preserve the approved concepts:

- Interpretations are not guaranteed to be fully accurate.
- The application is for informational, educational, and research purposes.
- It does not replace professional veterinary advice.
- Users are responsible for images they provide.
- Developers are not liable for decisions made solely from the application’s interpretations.
- Features may change as the prototype develops.
- Inappropriate or harmful content is not permitted.
- Continued use indicates acceptance.

### Privacy content

Preserve the approved content areas:

- Intended Google login data
- Image data
- Cat profile data
- Data usage
- Data deletion
- Security

Do not invent additional legal promises. Current mock behavior must not be presented as active production authentication, storage, or security infrastructure.

Legal and privacy text should remain faithful to approved project content and should be reviewed before any public deployment.

---

## 7. Camera and Emotion Detection Flow

### Required flow

Camera → Capture or mock image selection → Analysis/loading → Result → Save → Choose Cat → Confirmation

This flow is established and must be preserved.

### Camera preview

- Use a full-screen dark viewfinder treatment.
- A placeholder is appropriate while real camera access is out of scope.
- Clearly identify simulated behavior where needed for prototype testing.
- Keep the tab bar visible on the root Camera screen.
- Keep controls clear of the bottom navigation and system safe areas.

The prototype establishes the relationship among the viewfinder, capture control, thumbnail/gallery affordance, and help control. Exact coordinates may be adapted for safe areas and different device dimensions.

### Controls

Include:

- A prominent circular capture button
- A recent-image or mock-gallery affordance
- A What to Avoid/help control

Place controls in the same general visual regions indicated by the prototype. Minor positioning refinements are allowed for reachability, visual balance, and device compatibility.

### Mock capture

- Capture initiates a deterministic mock analysis flow.
- Avoid presenting random behavior as real inference.
- Mock gallery samples may map to predictable result scenarios for demonstration and testing.
- Do not expose test controls that make the production-facing prototype feel technical unless they are placed behind a development-only mechanism.

### Analysis state

- Display the selected or captured mock image.
- Show a short, calm analysis state such as “Reviewing observable cues…”
- Use a subtle activity indicator.
- Do not display fake neural-network metrics or invented technical processing stages.
- Transition naturally to the selected mock result.

The prototype establishes a result transition but does not require an exact loading duration or animation. Use a restrained implementation appropriate to the mock flow.

### Retake

- Available from result and error states.
- Returns to Camera without saving.
- Clears the unsaved capture state.

---

## 8. What to Avoid

Present the guidance as a modal or camera overlay consistent with the prototype.

### Content

Show the five established examples:

- Blurry Images
- Dark Images
- Not Cats
- Cropped Image
- Physical Deformities

### Layout

- Use a rounded light panel over the camera.
- Show a clear “What to Avoid” heading with restrained warning iconography.
- Include brief supporting text explaining that these conditions may reduce result reliability.
- Present the examples in a compact visual arrangement resembling the prototype.
- Use a balanced responsive grid or wrapping layout rather than treating an exact column count as mandatory on every screen width.
- Each item contains an example image or neutral placeholder and a short label.
- Include a clear Continue action.

### Tone

- Informative, not punitive.
- Avoid alarming full-danger treatment.
- Use neutral warning styling and plain language.
- Do not imply that cats with physical differences are invalid; explain only that the current prototype may have difficulty interpreting some images.

---

## 9. Emotion Detection Result

### Structure

Preserve the prototype’s main composition:

- Captured mock image as the primary visual
- Back or retake action
- Save action for normal-confidence results
- Rounded light result panel associated with the lower portion of the screen

Exact panel height, control offset, and image proportion may adapt to content length, safe areas, and device size.

### Result content

Display:

- Emotion icon or approved cat-expression graphic
- Emotion label
- Confidence percentage
- Confidence caption
- “Recommended Actions” heading
- Emotion-specific recommendations

### Emotion categories

Only use:

- Happy
- Neutral
- Fearful
- Angry

### Recommendations

Recommendations must be supportive and non-diagnostic. They may suggest observation, space, gentle interaction, a quiet environment, or avoiding possible stressors.

They must not:

- Make unsupported medical claims
- Assert certainty about internal emotional state
- Replace veterinary advice
- Present the result as diagnosis

### Save

- Available only when the normal result is eligible for saving.
- Opens the Choose Cat flow.
- Does not perform real upload or storage.
- Maintain the prototype’s prominent but compact Save treatment.

### Non-diagnostic framing

The result represents a mock interpretation of observable emotional cues. It must not be described as veterinary diagnosis, definitive emotional truth, or professional advice.

---

## 10. Low Confidence Result

### Structure

Preserve the normal result composition so the user recognizes it as part of the same flow.

Display:

- Interpreted emotion category
- Emotion indicator
- Low confidence percentage
- Clear low-confidence explanation
- Prompt to try again

### Visual distinction

- Use the normal emotion treatment with reduced emphasis or an added neutral warning treatment.
- Do not use an aggressive error presentation.
- Hide or disable Save.
- Give Retake or Retry clear priority.

The exact warning container style is not rigidly established. Choose a treatment that is visually compatible with the result card and makes the limitation easy to understand.

### Copy direction

Explain that the low confidence level may affect the reliability of the interpretation and that the user should try another clear, well-lit image.

Avoid wording that implies the system has definitively identified an emotion despite low confidence.

---

## 11. Detection Error

### Layout

- Retain the captured image or camera background where practical.
- Show a clear rounded light message card.
- Keep the message concise.
- Preserve the prototype’s calm overlay approach.

Exact card width and vertical placement may adapt to screen size.

### Content

Use:

- “Emotion Detection Error.”
- “Please try again.”
- Continue or Retry action

Where the selected mock scenario provides a specific cause, use friendly wording such as:

- No cat could be identified in this image.
- The image appears too blurry.
- The image appears too dark.
- Please try a clearer photo with the full cat visible.

### Tone

- Calm and recoverable
- No technical error codes
- No aggressive full-screen danger treatment
- Return directly to Camera when the user continues

---

## 12. Save and Choose Cat

### Structure

Preserve:

- Deep screen without the floating tab bar
- “Save” header
- Add Cat affordance
- Scrollable destination list

The exact header control placement should follow the prototype and remain consistent with other detail headers.

### Destination list

Show:

- All normal cat profiles
- Unknown Cats as the protected system destination

Each row should contain:

- Profile thumbnail or placeholder
- Cat name
- Clear tappable area
- Consistent visual separation

Dividers, spacing, and row height may be refined for readability and touch usability.

### Selection and confirmation

Selecting a destination opens:

> Save image in [Cat Name]?

Actions:

- Cancel
- Save

Cancel returns to destination selection. Save creates the frontend mock image and detection record together.

### Success

After saving, show:

- Success icon
- “Image Saved!”
- Continue action

Continue returns to Camera and clears the pending capture.

### New cat

The Add action opens New Cat Profile. After successful creation:

- Show “Cat Profile Saved!”
- Add the cat to the destination list.
- Keep the unsaved capture available.
- Let the user select the new cat as the destination.

---

## 13. New Cat Profile

### Fields

Include:

- Profile image
- Cover image where applicable
- Name
- Gender
- Birthdate
- Derived age
- Save
- Cancel

The prototype establishes this information and the general visual hierarchy. Exact field dimensions and sheet height may adapt to the keyboard, safe area, and device height.

### Image controls

- Use a wide cover placeholder with a camera or edit badge.
- Use an overlapping circular profile image placeholder.
- Current behavior remains mock-only.
- If bundled local assets are available, allow selection from an approved mock image set.
- Do not invoke a real camera, picker, filesystem, or cloud service.

### Name

- Required
- Trim surrounding whitespace
- Show a clear validation message when empty
- Prevent Save while invalid

### Gender

- Present Male and Female using compact controls consistent with the prototype.
- Show both text and a selected indicator.
- Do not rely only on color.
- The exact segmented or pill styling may be refined for clarity.

### Birthdate and age

- Birthdate is the source of truth.
- Store and process it consistently as a calendar date.
- Age is derived from birthdate.
- If the prototype’s Age control remains visible, make it read-only or automatically synchronized with birthdate.
- Do not allow birthdate and age to contradict one another.
- Future dates are invalid.

### Actions

- Cancel discards unsaved form values.
- Save creates both the cat and its associated album.
- Successful creation shows the established confirmation state.

---

## 14. Cat Album

### Layout

Preserve:

- Root tab screen with floating navigation
- “Cat Album” page heading
- Visual album-card grid
- Warm background
- Rounded photo-backed cards
- Unknown Cats entry

The prototype presents a two-column composition on its reference device. Two columns are the recommended phone default, but the implementation may adapt card width or column count only when needed to preserve comfortable proportions on materially different widths.

### Album cards

Each card should contain:

- Cover image from the newest saved image when available
- Neutral placeholder when empty
- Cat name over a readable lower overlay
- Rounded corners
- Clear pressed state

Overlay opacity, label padding, and image crop may be refined for readability.

### Unknown Cats

- Always visible
- Treated as a protected system album
- May contain saved images and detections
- Must not behave as a normal cat profile
- Cannot be renamed or deleted

### Empty states

A normal empty album remains visible and opens to an empty state explaining that saved photos will appear there.

### Long press

Long-pressing a normal album reveals album management actions. Long-press on Unknown Cats must not expose rename or delete actions.

A short unobtrusive hint may be used to make the long-press interaction discoverable.

---

## 15. Album Actions

### Available actions

- Rename
- Delete
- Cancel

### Presentation

Follow the prototype’s contextual action treatment. A compact bottom action area or bottom sheet may be used, depending on which presentation most naturally preserves the prototype’s hierarchy and works across supported screen sizes.

The action set and interaction meaning must remain unchanged.

### Rename

- Show the current name in an editable field.
- Require a non-empty name.
- Renaming the album also updates the connected cat profile name.
- Reflect the updated name across Album, My Cats, filters, and history.

### Delete

Show:

> Delete this album?

Clarify that deleting a normal cat album also removes the associated cat profile and its locally held mock images and records.

Actions:

- Delete
- Cancel

### Success state

A brief acknowledgement may be used if it improves clarity. Do not add an unnecessary step when the updated album grid already communicates the result.

### Unknown Cats protection

The UI must not expose Rename or Delete for Unknown Cats. The shared data layer must also reject these operations.

---

## 16. Individual Album

### Header

Include:

- Back button
- Album title
- Optional selected-count subtitle during selection mode
- No floating tab bar

Header spacing and typography should match other detail screens.

### Photo grid

The prototype uses a compact multi-column gallery. A three-column grid is a reasonable phone default, but the implementation should preserve readable thumbnail sizes rather than enforce a fixed count on every device.

Use:

- Square or near-square image crops
- Small consistent gaps
- Rounded corners
- Bundled mock images where available
- An optional unobtrusive emotion indicator

### Empty state

Display:

- Camera or image icon
- “No photos yet”
- Short explanation that saved photos will appear here

The exact empty-state spacing may be refined to remain vertically balanced.

### Long press

Long-pressing a photo enters selection mode and selects that photo.

### Selection action bar

Show:

- Select All
- Download
- Delete

Keep actions clear and visually balanced. Delete uses danger color, but the surrounding interface should remain calm.

The exact bar position may follow the prototype while accounting for safe areas and device navigation controls.

---

## 17. Multi-Select Photo Management

### Entering selection mode

- Long press selects the initial photo.
- Show selection indicators on every tile.
- Update the header with the selected count.
- Reduce unrelated actions while selection mode is active.

### Selected state

- Use a visible check indicator.
- Add a clear border, restrained overlay, or both.
- Do not rely solely on color.
- The exact checkmark placement may be adjusted to avoid covering important image content.

### Select All

- Selects every image in the current album.
- When all are selected, the same action may clear all selections.
- The label or selected state should make the current behavior understandable.

### Download

- Remains a mock action.
- If nothing is selected, disable it or provide clear guidance.
- Show appropriate confirmation feedback for the selected count.
- Do not write files.

### Delete

- Disabled when selection is empty.
- Opens “Delete these Photos?”
- Cancel preserves the selection.
- Delete removes the selected mock images and their connected detection records.

### Leaving selection mode

- Back exits selection mode before leaving the album.
- Clearing all selections may keep selection mode active until explicitly dismissed if the header and controls make this clear.

### Success

After deletion, show:

- “Images Deleted”
- Continue

Continue returns to the updated album and exits selection mode.

---

## 18. Single Photo View

### Layout

Preserve the prototype’s principal hierarchy:

- Deep screen without floating tabs
- Date and time header
- Large image presentation
- Action row
- Emotion detail when requested

Exact image height should respond to available screen space and the mock image aspect ratio rather than use one fixed dimension on every device.

### Actions

- Emotion
- Download
- Delete

Keep icon and label treatment consistent with other bottom actions.

### Emotion details

The Emotion action reveals a result panel consistent with the Camera result:

- Emotion category
- Confidence
- Recommended actions
- Emotion color and icon

Use terminology that describes a mock interpretation of observable emotional cues.

### Download

- Mock-only
- Provide immediate feedback
- Do not access the filesystem

### Delete

Show:

> Delete this Photo?

Actions:

- Delete
- Cancel

After deletion, show:

- “Image Deleted”
- Continue

Continue returns to the parent album.

### Missing record

If the image was already deleted, show a friendly unavailable state with a reliable Back action.

---

## 19. Calendar and Detection History

### Month view

Preserve:

- Root tab screen with floating navigation
- Month and year heading
- Previous and next month controls
- Seven-column calendar structure
- Selected-date treatment
- Today treatment
- Adjacent-month dates
- Detection indicators
- Event area below the calendar

The prototype presents Sunday-first weeks. Preserve that ordering unless an explicit project decision changes it.

Exact cell dimensions and spacing may adapt to device width.

### Detection dates

- Show an emotion indicator on dates with records.
- Use emotion color plus an icon or expression.
- If several records exist on one day, use a consistent rule such as the latest record for the representative marker.
- Keep day cells easy to scan.
- Avoid crowding multiple full event labels into the calendar cell.

### Birthday events

- Derive birthdays from cat birthdates.
- Display as all-day entries.
- Use a distinct but visually compatible birthday indicator.
- Do not present birthdays as emotion detections.

### Selected date records

Below the calendar, show:

- TODAY or the formatted selected date
- Current cat filter
- Chronological event list
- Cat name
- Emotion category
- Time
- Birthday label when applicable

Spacing may be refined so multiple records remain readable without making the sheet unnecessarily tall.

### Scrolling and collapse

The intended behavior is:

- Initial display shows the full month.
- Vertical scrolling toward the event list collapses the calendar into a compact selected-week representation.
- Returning toward the top restores the full month.
- An expand affordance may also restore the month.
- Use subtle motion that does not distract or cause visible layout instability.

The prototype establishes the full-to-compact relationship but not exact scroll thresholds, animation durations, or sticky offsets. Choose natural values consistent with mobile UX and the current layout.

### Event detail

Tapping a detection opens a detail presentation containing:

- Saved mock image
- Emotion category
- Confidence
- Recommended actions
- Date and time

The exact presentation may be a focused modal or deep screen if both preserve the prototype hierarchy and do not expose the root tab bar inappropriately.

---

## 20. Calendar Filter

### Presentation

- Show a clear “Select” heading.
- Use a scrollable list when necessary.
- Use the established warm overlay and rounded light surface.

The prototype establishes a focused selection view. A modal, sheet, or full-height overlay may be chosen according to available space, provided the interaction remains simple and consistent.

### Options

- All Cats
- Every normal cat profile
- Unknown Cats

### Rows

Each row should include:

- Thumbnail or placeholder
- Name
- Visible selected checkmark

### Behavior

- Default to All Cats.
- Selecting an option applies the filter and closes the selector.
- The chosen filter affects both calendar markers and the selected-date event list.
- Unknown Cats appears as a protected album-style option, not a normal cat profile.
- Closing without selection keeps the existing filter.

---

## 21. My Cats

### Layout

Preserve:

- Root tab screen with floating navigation
- “My Cats” heading
- Add action
- Vertically scrollable cat-card list

### Cat cards

The prototype uses wide rounded photo-backed cards. Preserve that composition.

Each card should include:

- Cover image or placeholder
- Cat name over a readable image overlay
- Comfortable spacing
- Clear pressed feedback

Exact card height may adapt to screen width while retaining the broad horizontal character.

### Summary information

Keep the list visually simple. If a small latest-cue summary is included, it should remain secondary and must not turn the card into a dashboard.

Do not introduce unrelated statistics.

### Add cat

The Add action opens New Cat Profile.

### Navigation

- Tapping a card opens Cat Profile.
- Album access may be available from the Cat Profile where supported by the established flow.
- Unknown Cats must not appear in My Cats.

### Empty state

Show:

- Friendly paw or cat icon
- “No cats added yet”
- Brief explanation
- “Add your first cat” action

---

## 22. Cat Profile

### Structure

Preserve the prototype’s hierarchy:

- Deep screen without floating tabs
- Cover image
- Overlapping circular profile image
- Back action
- Centered cat name
- Latest emotion-cue summary
- Cats Info
- Gender, birthdate, and age

Exact cover height and avatar overlap may adapt proportionally to device size.

### Emotion summary

Show:

- Latest emotion icon
- Emotion category label
- “Latest Detected Emotion” or another approved non-definitive label
- Last checked date
- Confidence percentage

Avoid language suggesting that the application knows the cat’s internal emotional state with certainty.

If no records exist, show a friendly “No detections yet” state instead of empty statistics.

### Cats Info

Display:

- Gender
- Birthdate
- Derived age

Use a light rounded card with clear labels and balanced spacing. Exact column widths may adapt to content and device size.

### Album access

Provide clear access to the cat’s album if supported by the current profile flow. Do not add an unrelated dashboard or new management area.

### Profile actions

Where profile management is available:

- Edit
- Rename
- Delete

Delete always requires confirmation and removes the associated normal album, mock images, and detection records.

---

## 23. Settings

### Layout

Preserve:

- Root tab screen with floating navigation
- Account summary at the top
- About
- Give us Feedback
- Privacy Policy
- Terms and Conditions
- Log out

The page should scroll when required by screen height or larger text settings.

### Account summary

Show:

- Mock profile image or placeholder
- Display name
- Email address

Do not imply that real Google account access occurred.

### Rows

Use the established order:

1. About
2. Give us Feedback
3. Privacy Policy
4. Terms and Conditions
5. Log out

Each row should include:

- Rounded icon treatment
- Label
- Chevron for navigation rows
- Distinct but restrained danger treatment for Log out

Exact row padding and icon-circle size may be refined to improve rhythm and touch usability.

---

## 24. Logout

### Confirmation

Tapping Log out opens:

> Log out?

Include a concise confirmation message.

Actions:

- Log out
- Cancel

### Behavior

- Cancel closes the dialog.
- Log out clears the mock session.
- Navigate to Login.
- Prevent navigation back into authenticated screens.
- Do not call a real authentication provider.

The dialog should use the same confirmation pattern as other destructive or consequential actions.

---

## 25. About FeELINE

### Structure

- Deep screen with back header
- Scrollable body
- Short paragraphs
- Concise feature list
- Comfortable line height and section spacing

Exact paragraph length and spacing may be refined for readability while preserving approved content.

### Content direction

Communicate that FeELINE:

- Is an academic and research-oriented mobile prototype
- Is designed to help users interpret observable emotional cues in cat images
- Uses the categories Happy, Neutral, Fearful, and Angry
- Supports cat profiles
- Supports mock image-based interpretations
- Holds mock scanned images during the current session
- Organizes detection history by date

Clearly state that FeELINE is intended for educational and research purposes and is not veterinary diagnosis or professional veterinary advice.

Avoid presenting the current frontend mock as an operational AI service.

---

## 26. Feedback

### Fields

Use the approved Feedback Form structure:

- Title, where retained by the prototype
- Email
- Subject
- Message
- Submit

Email, Subject, and Message are required at minimum. Do not add unrelated form fields.

### Validation

- Show missing-field messages clearly.
- Validate basic email structure.
- Keep entered values when validation fails.
- Move focus or scroll to the first invalid field where practical.
- Prevent repeated submission while the mock interaction is processing.

Exact validation presentation may use inline text, a form summary, or both, provided it remains calm and understandable.

### Mock submission

- Do not make a network request.
- Show a brief simulated loading state only if it improves interaction clarity.
- On success, display:
  - “Thank you for your Feedback!”
  - Continue or Done action

Returning from success goes back to Settings.

---

## 27. Shared Components

### ScreenContainer

Should:

- Handle safe areas
- Apply the warm background
- Support scrollable and fixed layouts
- Apply consistent page padding
- Support bottom-tab clearance

Padding values should come from the shared theme and may adapt for full-bleed screens.

### FullBleedScreen

- Used for Camera and image-first experiences
- Extends backgrounds behind system areas
- Keeps interactive controls within safe areas
- Does not force ordinary content screens into an edge-to-edge layout

### Button

Support:

- Primary
- Outline
- Destructive
- Google
- Loading
- Disabled
- Compact and regular presentations

Buttons should share consistent height, radius, typography, and feedback while allowing small size adjustments where the prototype uses compact actions.

### GoogleButton

- Uses the shared Button foundation
- Includes the Google mark
- Remains mock-only
- Preserves the recognizable white rounded treatment

### Cards

- Light surface
- Rounded corners
- Subtle elevation
- Consistent internal spacing
- Avoid unnecessary nested cards

Card proportions may vary by purpose while retaining a shared visual family.

### ConfirmModal

Support:

- Confirmation title
- Optional message
- Confirm
- Cancel
- Destructive treatment
- Single-action success acknowledgement

The modal should adapt to message length rather than use a rigid fixed height.

### Inputs

Use a consistent pattern for:

- Labels
- Text entry
- Placeholder text
- Error messages
- Focus state
- Disabled or read-only state
- Multiline content

### SettingRow

- Consistent icon treatment
- Label
- Chevron where applicable
- Destructive variation
- Comfortable touch target

### EmotionResultCard

Support:

- Normal result
- Low-confidence result
- Placeholder or mock state
- Four emotion variants
- Confidence
- Recommended actions

The card should adapt vertically to its copy rather than use a fixed height.

### Emotion indicators

- Centralized color lookup
- Emotion icon or approved graphic
- Optional label
- Accessible non-color distinction

### FloatingTabBar

- Five fixed destinations
- Rounded floating pill
- Selected-state treatment
- Safe-area-aware bottom position
- Clear accessibility labels

Exact width, icon-circle size, and spacing may adapt slightly to device width while preserving the prototype identity.

### CaptureButton

- Prominent circular control
- Clear pressed state
- Disabled or loading state where appropriate
- Comfortable touch target

### Image placeholders

- Preserve expected image proportions.
- Use a neutral background and simple iconography.
- Clearly distinguish placeholders from broken images.
- Avoid placeholder styling that looks like finished photography.

### Empty states

Include:

- Friendly icon
- Concise title
- Optional one-sentence explanation
- Optional primary action

Positioning may adapt to the amount of surrounding content.

### Loading states

- Use subtle activity indicators or lightweight placeholders.
- Avoid blocking overlays for minor operations.
- Never show technical service messages.
- Preserve layout where practical to avoid disruptive movement.

---

## 28. Interaction Design

### Tap behavior

- Every tappable item provides immediate visual feedback.
- Avoid invisible tap regions detached from visible controls.
- Prevent duplicate actions during loading.
- Use the most natural pressed treatment for the component, such as slight opacity, tint, or elevation change.

### Long press

Use only where established:

- Album management
- Photo selection

Provide enough visual or helper guidance that users can discover the interaction without adding clutter.

### Modal behavior

- Dim the background.
- Keep focus on one decision.
- Outside-tap dismissal is acceptable for non-destructive sheets.
- Destructive confirmation should require an explicit button choice.
- Avoid accidental dismissal while a destructive action is processing.

### Selection mode

- Clearly change the header state.
- Show selected count.
- Provide visible selection marks.
- Back exits selection before navigating away.
- Keep selection controls visually stable as items are selected or cleared.

### Destructive actions

- Use danger color on the destructive action.
- Always provide Cancel.
- Describe deletion scope when related data will also be removed.
- Never trigger deletion directly from a long press.

### Loading

- Preserve layout to avoid unnecessary jumps.
- Use short, calm feedback.
- Do not simulate complex technical processing.
- Exact loading duration should be only as long as needed to communicate state.

### Success

- Use the success color and checkmark.
- Keep messages concise.
- Provide a clear Continue or Done action.
- Avoid excessive celebratory animation.

### Error

- Explain what happened in plain language.
- Provide a recovery action.
- Preserve entered data where possible.
- Avoid exposing technical details.

### Disabled states

- Reduce emphasis while maintaining readability.
- Do not use opacity so low that labels become inaccessible.
- Ensure disabled controls cannot be activated.
- Where necessary, explain why an action is unavailable.

### Navigation transitions

- Root tab switching should feel immediate.
- Deep screens should use subtle platform-compatible transitions.
- Modals may fade or slide gently.
- Avoid bouncing, spinning, or decorative motion.
- Exact durations are implementation details.

### Scrolling

- Use vertical scrolling for content-heavy screens.
- Keep headers and compact controls stable where useful.
- Avoid nested scrolling unless necessary.
- Ensure the floating tab bar does not obscure content.
- Preserve natural scroll momentum and platform behavior.

---

## 29. Responsive Mobile Layout

### Safe areas

- Respect notches, status bars, navigation gestures, and home indicators.
- Full-bleed imagery may extend behind system UI.
- Interactive controls must remain reachable and unobscured.

### Small screens

- Allow forms and policy pages to scroll.
- Avoid fixed heights for text-heavy content.
- Stack actions vertically if horizontal actions become cramped.
- Keep headings from colliding with header actions.
- Allow result cards and modals to expand with text.

### Larger screens

- Preserve a comfortable mobile content width.
- Do not stretch cards and text excessively.
- Maintain the prototype’s overall proportions and visual balance.
- Use responsive margins rather than introducing desktop-like layouts.

### Keyboard handling

- Keep the active input visible.
- Allow forms to scroll above the keyboard.
- Ensure Save and Submit remain reachable.
- Dismiss the keyboard naturally when tapping outside or submitting.
- Avoid abrupt layout jumps.

### Content padding

- Use consistent theme-based horizontal padding.
- Use reduced padding only where the prototype intentionally uses edge-to-edge imagery.
- Keep vertical section rhythm consistent.

### Bottom navigation spacing

- Root tab content must include sufficient clearance beneath the last item.
- Camera controls must sit above the floating tab bar and safe area.
- Exact clearance should be calculated from the rendered tab-bar size rather than assumed universally.

### Modal sizing

- Centered dialogs should fit within the safe viewport.
- Large forms should use a scrollable presentation.
- Modal height should be driven by content and available space.
- Avoid oversized empty modal areas and clipped content.

### Touch targets

- Use approximately 44 by 44 pixels as a recommended minimum.
- Increase targets where the prototype’s visible icon is smaller.
- Provide enough space between adjacent destructive and non-destructive actions.

---

## 30. Accessibility

- Maintain readable contrast between text and background.
- Do not use muted text for essential instructions.
- Pair emotion colors with labels and icons.
- Pair error colors with readable messages.
- Give icon-only buttons accessibility labels.
- Announce loading, success, and error states where supported.
- Use logical reading and focus order.
- Support dynamic text without severe clipping where practical.
- Avoid embedding essential text inside images.
- Keep modal focus within the active modal where platform support allows.
- Use comfortable touch targets.
- Use descriptive labels such as “Delete selected photos,” not only “Delete.”
- Clearly identify selected tabs, cats, filters, dates, and photos.
- Do not rely on long press as the only undisclosed path to essential functionality; include a short hint where needed.
- Keep policy and About text left-aligned for readability.
- Avoid excessive uppercase text.
- Respect reduced-motion preferences where available.
- Allow small layout refinements when necessary to support larger text and accessibility settings.

---

## 31. Mock-Only Constraints

The current frontend phase must not implement:

- Real backend or API integration
- Railway deployment
- PostgreSQL access
- Real Google OAuth
- Real AI inference
- Real camera access
- Real image picker
- Cloud image storage
- Filesystem persistence
- AsyncStorage
- External feedback submission
- External authentication
- External analytics or third-party services

### Required mock behavior

- Mock login must work locally.
- Mock capture and gallery scenarios must be usable.
- Mock results must be clearly represented as simulated interpretations of observable emotional cues.
- Cats, albums, images, and detection records must work through shared in-memory state.
- Save, rename, delete, select, filter, and confirmation flows must function during the current session.
- Mock downloads must provide feedback without writing files.
- Reloading the application may restore the initial mock dataset.
- Future API and AI boundaries should remain separated from UI components.
- No screen should imply that a real external operation succeeded when no such operation occurred.

---

## 32. Visual Refinement Rules

### General rule

Follow the prototype closely. Refine rather than redesign.

A refinement is acceptable when it improves clarity, consistency, accessibility, visual balance, or mobile usability without altering the screen’s purpose, hierarchy, navigation, identity, or core interaction flow.

**When a small visual or UX improvement is clearly beneficial and remains within the boundaries of this specification, the implementation agent may apply the refinement directly rather than rigidly reproducing a weaker prototype detail. Minor refinements do not require redesigning the surrounding screen or flow.**

The prototype remains the primary source of truth. This principle permits limited improvement; it does not grant permission to reinterpret the product.

### Preserve

Preserve when the prototype clearly establishes:

- Screen purpose
- Main information
- Major layout relationships
- Action order
- Five-tab navigation
- Warm background
- Rounded cards and controls
- Camera-to-result-to-save flow
- Album and calendar structure
- Settings hierarchy
- Four emotion categories
- Academic and non-diagnostic framing

A preserved design does not require mechanical pixel copying. It requires maintaining the same identity, hierarchy, and user experience.

### Refine

Refinement is appropriate when it improves:

- Spacing and alignment
- Visual hierarchy
- Readability
- Component consistency
- Touch usability
- Responsive behavior
- Keyboard handling
- Accessibility
- Selection clarity
- Pressed, loading, success, and error feedback
- Safe-area behavior
- Scrolling
- Modal fit and content balance

Refinements should remain local to the element or pattern being improved. They should not trigger unrelated changes to the surrounding screen.

### Clarify

Clarification is appropriate when:

- An icon’s meaning is ambiguous.
- A destructive action affects related data.
- Mock behavior might be mistaken for real AI or storage.
- Low confidence needs stronger explanation.
- A form value such as age is derived from birthdate.
- Unknown Cats needs to be distinguished from normal profiles.
- A calendar filter affects both markers and events.
- Emotion wording could imply certainty about internal emotional state.
- A hidden long-press interaction needs discoverability.

Clarification should preserve the original functionality and flow.

### Acceptable refinements

- Slightly improving spacing
- Increasing undersized touch targets
- Improving typography hierarchy
- Refining card proportions
- Aligning icons and labels
- Improving modal spacing
- Making selection indicators clearer
- Improving empty states
- Adding subtle pressed feedback
- Improving loading and confirmation feedback
- Standardizing related screens
- Improving keyboard handling
- Making long-press behavior more discoverable
- Preventing content from being hidden by the floating tab bar
- Improving contrast while preserving the palette
- Allowing cards or result panels to grow with text
- Adjusting grid gaps or thumbnail size for different phone widths
- Choosing a natural platform transition when the prototype does not specify one
- Using a bottom sheet instead of a cramped centered modal when the content and prototype intent support it

### Unacceptable redesigns

- Replacing the five-tab navigation
- Changing the entire color system
- Creating a dashboard home screen
- Adding social sharing, chat, gamification, or user feeds
- Reordering the Camera, Album, Calendar, My Cats, and Settings structure
- Changing the capture-save workflow
- Adding unrelated analytics or veterinary monitoring
- Introducing medical charts or heartbeat visuals
- Replacing the warm visual identity with a dark, clinical, corporate, or futuristic style
- Adding major screens not supported by the prototype
- Changing the four emotion categories
- Presenting results as diagnosis or certainty
- Adding backend-dependent behavior during the mock phase
- Redesigning an entire screen because one component needs refinement
- Replacing established prototype interactions solely for novelty

### Handling ambiguous details

When the prototype does not clearly define an exact implementation detail:

1. Preserve the surrounding screen hierarchy.
2. Use an existing shared component or token where possible.
3. Choose the simplest natural mobile interaction.
4. Prefer consistency with another FeELINE screen over inventing a new pattern.
5. Apply only the smallest refinement necessary.
6. Avoid introducing a new feature to solve a visual problem.
7. Confirm that the result still looks recognizably derived from the prototype.

---

## 33. Implementation Priority

Implement the frontend UI in the following order:

1. **Global theme and design tokens**
   - Centralize colors, emotion palette, typography, spacing, radii, shadows, and component states.
   - Establish the approved warm visual foundation.
   - Treat exact numerical values as implementation defaults unless explicitly established.

2. **Shared layout and components**
   - Complete ScreenContainer, headers, buttons, inputs, cards, modals, empty states, emotion indicators, placeholders, and loading states.
   - Build flexibility into shared components so responsive refinements do not require screen-specific duplication.

3. **Navigation and screen shells**
   - Confirm root tabs, deep routes, modal boundaries, back behavior, tab visibility, and safe-area behavior.
   - Preserve the prototype’s hierarchy and five-tab structure.

4. **Authentication and splash UI**
   - Complete branded Splash, mock Login, loading and pressed states, and legal links.
   - Do not add real Google authentication.

5. **Camera and result flow UI**
   - Complete mock Camera, What to Avoid, analysis state, normal result, low confidence, error, save, choose-cat, and confirmation.
   - Keep all analysis and result wording consistent with observable emotional cues and mock-only behavior.

6. **Cat, profile, and album UI**
   - Complete cat creation and editing, My Cats, Cat Profile, album grid, album management, individual albums, multi-select, and Single Photo.
   - Preserve Unknown Cats as a protected system album.

7. **Calendar UI**
   - Complete month view, compact week collapse, birthday entries, detection history, filtering, and event details.
   - Refine spacing and responsive behavior without changing the intended calendar flow.

8. **Settings, legal, About, and Feedback**
   - Complete account presentation, policies, About content, mock feedback, and mock logout.
   - Review all wording for research, privacy, mock-only, and non-diagnostic consistency.

9. **Interaction polish**
   - Standardize pressed, disabled, loading, success, error, confirmation, selection, and transition behavior.
   - Apply small beneficial refinements without redesigning surrounding screens.

10. **Accessibility and responsive QA**
    - Check safe areas, small screens, keyboard behavior, touch targets, contrast, labels, focus order, text scaling, and reduced-motion behavior.
    - Adjust ambiguous dimensions using the centralized system rather than isolated screen values.

11. **Final prototype fidelity review**
    - Compare every completed screen and flow against the high-fidelity prototype.
    - Confirm that established identity, hierarchy, navigation, and core behavior remain recognizable.
    - Retain only refinements that materially improve clarity, consistency, accessibility, touch usability, or mobile polish.
    - Remove any change that introduces feature creep or makes the application feel redesigned rather than refined.