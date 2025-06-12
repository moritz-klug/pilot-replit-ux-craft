// Script to be injected into the iframe
const highlightScript = `
  let highlightedElement = null;
  let originalStyles = null;

  // Function to find the closest matching element
  function findMatchingElement(elementId) {
    // First try exact match
    let element = document.querySelector(\`[data-feature-id="\${elementId}"]\`);
    if (element) return element;

    // Try to find by text content
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.find(el => {
      const text = el.textContent?.toLowerCase() || '';
      const id = elementId.toLowerCase();
      return text.includes(id);
    });
  }

  window.addEventListener('message', (event) => {
    if (event.data.type === 'HIGHLIGHT_ELEMENT') {
      // Clear previous highlight
      if (highlightedElement) {
        highlightedElement.style.outline = originalStyles.outline;
        highlightedElement.style.outlineOffset = originalStyles.outlineOffset;
        highlightedElement.style.transition = originalStyles.transition;
      }

      // Find element
      const element = findMatchingElement(event.data.elementId);
      if (element) {
        highlightedElement = element;
        originalStyles = {
          outline: element.style.outline,
          outlineOffset: element.style.outlineOffset,
          transition: element.style.transition
        };

        // Apply highlight styles
        element.style.outline = '2px solid #f97316'; // orange-500
        element.style.outlineOffset = '2px';
        element.style.transition = 'outline 0.2s ease-in-out';

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (event.data.type === 'CLEAR_HIGHLIGHT') {
      if (highlightedElement) {
        highlightedElement.style.outline = originalStyles.outline;
        highlightedElement.style.outlineOffset = originalStyles.outlineOffset;
        highlightedElement.style.transition = originalStyles.transition;
        highlightedElement = null;
        originalStyles = null;
      }
    }
  });
`;

export default highlightScript; 