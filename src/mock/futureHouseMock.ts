export const mockFutureHouseResponse = {
    recommendations: [
        `Enhance Contrast for Accessible Readability. The research emphasizes that CTA buttons must have high contrast relative to the surrounding background and the button's own text to ensure they are immediately perceptible. For your orange-styled CTA, verify that the button's orange background contrasts sharply with both the page's overall background and the button's text. For instance, if the background is light or similarly warm, consider pairing the orange with white (or an equally legible light color) for the text. Alternately, you could introduce a dark outline (using a color such as black or dark brown) to encapsulate the button. Studies have demonstrated that using a dark, high-contrast outline increases a button's visibility significantly (1.1).`,
        `Increase White Space and Visual Isolation. Scientific findings support the use of ample white space around interactive elements to reduce visual clutter and focus the user's attention on the CTA. By isolating the button within its own "visual field," you minimize interference from adjacent elements. This approach not only enhances clarity but also improves the overall user experience by reducing cognitive load during navigation (2.1).`,
        `Optimize Size, Placement, and Interactivity. The placement of a CTA button is critical. Applying principles such as Fitts's Law—which states that objects positioned closer to the user's natural pointer movement are more likely to be engaged—ensure the button is positioned in a prominent, easily accessible location within the hero section. In addition, check that the button's dimensions are large enough to be tapped on mobile devices while maintaining proportionality on desktop layouts. Consistent placement and sizing also reduce decision fatigue and facilitate intuitive interactions (3.1).`,
        `Utilize Adaptive Color Settings for Consistent Saliency. Recent studies on adaptive, image-based color theme generation have revealed that disabling strict color harmony adjustments may lead the system to select a more chromatic and attention-grabbing secondary color. While your primary brand orange might be a good fit, test dynamically adjusting its saturation or incorporating a contrasting accent (for example, a subtle darkened border) that adheres to WCAG-compliant contrast ratios. This adaptive approach can help ensure that the CTA remains uniformly salient, regardless of the background image or light/dark mode (4.1).`
    ],
    papers: [
        { title: "WCAG 2.1", url: "https://www.w3.org/WAI/WCAG21/quickref/" },
        { title: "Fitts's Law in UI Design", url: "https://www.nngroup.com/articles/fitts-law/" }
    ]
};

// Mock feature for testing enrichment
export const mockFeature = {
    title: "Hero CTA Button",
    description: "A large orange call-to-action button placed in the hero section. The button currently has low contrast with the background, minimal spacing from other elements, and no hover or focus state. The text reads 'Get Started'."
};

// Optionally, add a mock currentDesign string for clarity
export const mockCurrentDesign =
    "A large orange call-to-action button placed in the hero section. The button currently has low contrast with the background, minimal spacing from other elements, and no hover or focus state. The text reads 'Get Started'."; 