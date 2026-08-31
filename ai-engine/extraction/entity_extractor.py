import re


def clean_text(value):

    if not value:
        return None

    value = value.replace("\n", " ")

    value = re.sub(r"\s+", " ", value)

    # Remove strange OCR characters

    value = re.sub(r'[^A-Za-z0-9\s\-\&\.]', '', value)

    return value.strip()


def is_valid_entity(value):

    if not value:
        return False

    # Too long

    if len(value) > 80:
        return False

    # Too many digits

    digit_count = sum(
        c.isdigit() for c in value
    )

    if digit_count > 3:
        return False

    # Reject obvious boilerplate

    invalid_words = [

        # Legal boilerplate

        "agreement",
        "clause",
        "section",
        "article",
        "event",
        "developer",
        "signed",
        "road",
        "oilfield",
        "attorney",
        "notary",
        "public",
        "judgment",
        "court",
        "exhibit",
        "paragraph",
        "page",
        "schedule",

        # Generic legal noise

        "plaintiff",
        "defendant",
        "respondent",
        "petitioner",
        "appellant",
        "appellee",

        # Court headings

        "in the",
        "high court",
        "district court",
        "commercial court",
        "supreme court",

        # Banking/legal filler

        "did the bank",
        "1st defendant bank",
        "defendant bank",

        # OCR junk

        "parsed text",
        "page:",
        "vs",
        "no.",
        "case no",

        # Random extraction junk

        "honour",
        "j.",
        "mr.",
        "mrs.",
        "miss",

        "it was",
        "it is",
        "to pay",
        "shall",
        "thereof",
        "whereof",
        "hereby",
        "thereby",
        "payment",
        "liable",
        "claim",
        "damages",
        "contract",
        "sum",
        "amount",
        "banking",
        "interest",
        "loan",
        "property",
        "petition",
        "application"

    ]

    lower = value.lower()

    for word in invalid_words:

        if word in lower:
            return False

    # Reject overly long phrases

    if len(value.split()) > 8:
        return False

    # Reject all uppercase junk

    if value.isupper():
        return False

    # Reject very short values

    if len(value) < 4:
        return False

    # Reject values without letters

    if not re.search(r'[A-Za-z]', value):
        return False

    # Reject weird symbols

    if re.search(r'[{}<>/=]', value):
        return False

    # Reject lowercase phrases

    if value.islower():
        return False

    # Reject phrases starting with verbs

    bad_starts = [

        "to ",
        "is ",
        "was ",
        "are ",
        "were ",
        "be "

    ]

    for start in bad_starts:

        if value.lower().startswith(start):
            return False

    return True


def extract_case_number(text):

    patterns = [

        r'Case No\.?\s*[:.]?\s*(.*)',

        r'C\.H\.C\.\s*\d+\/\d+\/[A-Z]+'

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            if match.lastindex:

                value = clean_text(
                    match.group(1)
                )

            else:

                value = clean_text(
                    match.group(0)
                )

            if value:
                return value

    return None


def extract_judge(text):

    patterns = [

        r'Before\s*:\s*(.*)',
        r'Judge\s*:\s*(.*)'

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            value = clean_text(
                match.group(1)
            )

            if is_valid_entity(value):
                return value

    return None


def extract_petitioner(text):

    patterns = [

        r'(.+?)\s+Petitioner',
        r'(.+?)\s+Plaintiff'

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            petitioner = clean_text(
                match.group(1)
            )

            if (
                petitioner and
                is_valid_entity(petitioner)
            ):

                return petitioner

    return None


def extract_respondents(text):

    respondents = []

    patterns = [

        r'Vs\.(.+?)Respondents',
        r'Vs(.+?)Respondents',
        r'Vs\.(.+?)Defendants',
        r'Vs(.+?)Defendants'

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.DOTALL | re.IGNORECASE
        )

        if match:

            content = match.group(1)

            lines = content.split("\n")

            for line in lines:

                line = clean_text(line)

                if (

                    line and

                    len(line) > 5 and

                    not line.lower().startswith("before") and

                    not line.lower().startswith("case")

                ):

                    if is_valid_entity(line):

                        respondents.append(line)

    return list(set(respondents))


def extract_relationships(text):

    relationships = []

    cleaned = clean_text(text)

    # Explicit relationship index entries are used by researched dossiers.
    # They remain human-readable in the PDF while giving the demo pipeline a
    # safe, deterministic way to retain relationship semantics and provenance.
    explicit_matches = re.findall(
        r'RELATIONSHIP:\s*(.+?)\s*\|\s*([A-Z_]+)\s*\|\s*(.+)',
        text
    )

    allowed_relationships = {
        "APPELLANT_IN", "PETITIONER_IN", "PLAINTIFF_IN", "DEFENDANT_IN",
        "RESPONDENT_IN", "INDICTED_IN", "ACQUITTED_IN", "REPRESENTED_BY",
        "JUDGED_BY", "HEARD_BY", "APPEAL_OF", "RELATED_PROCEEDING",
        "INVESTIGATED_BY", "PROSECUTED_BY", "PRESENTED_TO", "PART_OF",
        "BROADCAST_BY", "AROSE_FROM", "GOVERNED_BY_STATUTE", "MENTIONED_IN"
    }

    for source_value, relationship, target_value in explicit_matches:
        source = clean_text(source_value)
        target = clean_text(target_value)

        # Case identifiers commonly contain many digits, so the generic name
        # validator is intentionally not used for this explicit dossier index.
        explicit_entity_is_safe = lambda value: (
            value
            and len(value) <= 120
            and re.search(r'[A-Za-z]', value)
            and not re.search(r'[{}<>]', value)
        )

        if (
            relationship in allowed_relationships
            and explicit_entity_is_safe(source)
            and explicit_entity_is_safe(target)
        ):
            relationships.append({
                "source": source,
                "relationship": relationship,
                "target": target
            })

    # =========================
    # EMPLOYED BY
    # =========================

    employed_matches = re.findall(

        r'([A-Z][a-z]+\s[A-Z][a-z]+)\s+was\s+employed\s+by\s+([A-Z][A-Za-z\s&]+(?:Bank|PLC|Group))',

        cleaned,

        re.IGNORECASE
    )

    for match in employed_matches:

        source = clean_text(match[0])
        target = clean_text(match[1])

        if (
            is_valid_entity(source)
            and
            is_valid_entity(target)
        ):

            relationships.append({

                "source": source,

                "relationship":
                    "EMPLOYED_BY",

                "target": target
            })

    # =========================
    # PARTNER OF
    # =========================

    partner_matches = re.findall(

        r'([A-Z][a-z]+\s[A-Z][a-z]+).*?partner\s+of\s+([A-Z][A-Za-z\s&]+(?:Construction|Holdings|Group|PLC|Ltd))',

        cleaned,

        re.IGNORECASE
    )

    for match in partner_matches:

        source = clean_text(match[0])
        target = clean_text(match[1])

        if (
            is_valid_entity(source)
            and
            is_valid_entity(target)
        ):

            relationships.append({

                "source": source,

                "relationship":
                    "PARTNER_OF",

                "target": target
            })

    # =========================
    # REMOVE DUPLICATES
    # =========================

    unique = []

    seen = set()

    for rel in relationships:

        key = (
            rel["source"],
            rel["relationship"],
            rel["target"]
        )

        if key not in seen:

            seen.add(key)

            unique.append(rel)

    print(unique)

    return unique

def extract_all(text):

    return {

        "case_number":
            extract_case_number(text),

        "judge":
            extract_judge(text),

        "petitioner":
            extract_petitioner(text),

        "respondents":
            extract_respondents(text),

        "relationships":
            extract_relationships(text)
    }
