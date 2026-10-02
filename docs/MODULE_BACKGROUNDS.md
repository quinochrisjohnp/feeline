# Module backgrounds

Edit `constants/moduleBackgrounds.ts`. Changes use normal Expo Fast Refresh; no route changes are needed.

To return only Album to the original cream background:

```ts
album: { mode: "color", image: BG3 },
```

To restore its artwork:

```ts
album: { mode: "image", image: BG3 },
```

To disable all six module backgrounds:

```ts
export const ENABLE_MODULE_BACKGROUNDS = false;
```

Set it back to `true` to respect each module's individual mode again. The fallback is `colors.background` (`#FFF7E9`). No imports or screen JSX need deleting.

| Setting | Asset | Screens |
| --- | --- | --- |
| auth | bg1.png | Login |
| settings | bg1.png | Settings, About, Feedback, Privacy, Terms |
| camera | bg2.png | Result, Save/Choose Cat, camera permission and mount-error states |
| calendar | bg2.png | Calendar and photos opened from Calendar |
| album | bg3.png | Album, Album Folder, Album Photo |
| catProfile | bg3.png | My Cats and its profile view |

The live camera preview always remains the camera feed. Modal cards, inputs, dim backdrops, and readable content surfaces retain their existing styling.

`ModuleBackground` is one stationary, noninteractive contain layer (complete artwork centered, cream filling unused space) inside the full screen root, outside the content SafeAreaView, scrolling, and keyboard avoidance. Asset metadata determines its intrinsic size; explicit displayed dimensions use `scale = min(viewportWidth / assetWidth, viewportHeight / assetHeight)`. Width and height are multiplied by that same scale, with centered offsets. Root layout is measured independently of content, and keyboard-only resizing does not move or rescale the background. Switching image mode changes only its image child, not the screen content tree.

Assets live in `components/images`: all three backgrounds are opaque RGB PNGs, 853×1844 (aspect ratio approximately 0.463). `illustration.png` is RGBA with transparency, 1122×1402 (approximately 0.800). Login uses contain with its intrinsic aspect ratio. Illustration height is capped at 220, 23% of the measured scroll viewport height, and 75% of available content width converted through the image ratio. Short screens, large text, and keyboard-reduced viewports retain scrolling; viewport growth resets the scroll position to the top. The background never participates in scroll-content measurement.
