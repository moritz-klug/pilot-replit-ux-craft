import re

def extract_papers_from_formatted_answer(formatted_answer):
    papers = []
    # Find the References section
    refs_match = re.search(r"References\s*\n(.+)", formatted_answer, re.DOTALL)
    if not refs_match:
        return papers  # No references found

    refs_text = refs_match.group(1)

    # Split into individual references (numbered)
    ref_entries = re.findall(r"\n?\s*(\d+)\.\s*\(([^)]+)\):\s*([^\n]+)", refs_text)
    # Each entry: (number, citation_key, title)
    for num, citation_key, title in ref_entries:
        # Optionally, parse citation_key for more info (e.g., authors, pages)
        # Example: "unknownauthors2017digitalmarketingin pages 14-18"
        # You can split by ' pages ' if you want
        if ' pages ' in citation_key:
            authors_part, pages_part = citation_key.split(' pages ', 1)
        else:
            authors_part, pages_part = citation_key, ''
        papers.append({
            "number": int(num),
            "citation_key": citation_key,
            "title": title.strip(),
            "authors": authors_part.strip(),
            "pages": pages_part.strip(),
        })
    return papers

# Example usage:
formatted_answer = """
...ce with high-contrast accessibility, and implement a content hierarchy that maximizes user engagement and conversion potential across devices (unknownauthors2017digitalmarketingin pages 14-18, unknownauthors2017digitalmarketingin pages 43-47, pqac-0ba2dc7f).

References

1. (unknownauthors2017digitalmarketingin pages 14-18): Digital marketing in travel industry. Case: Hotel landing page optimization

2. (unknownauthors2017digitalmarketingin pages 43-47): Digital marketing in travel industry. Case: Hotel landing page optimization

3. (unknownauthors2020onlineleadgeneration pages 67-70): Online Lead Generation in B2B Marketing: The Role of Conversion Design on the Corporate Website
"""
papers = extract_papers_from_formatted_answer(formatted_answer)
for paper in papers:
    print(paper)