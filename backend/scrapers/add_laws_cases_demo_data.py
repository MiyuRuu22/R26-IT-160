import psycopg2
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"


items = [
    # ======================
    # CRIMINAL - STATUTES
    # ======================
    {
        "content_type": "statute",
        "category": "criminal",
        "title": "Penal Code — Murder",
        "content": "Where the act by which death is caused is done with the intention of causing death, or with knowledge that the act is likely to cause death, the offence may amount to murder under criminal law."
    },
    {
        "content_type": "statute",
        "category": "criminal",
        "title": "Penal Code — Hurt",
        "content": "Whoever causes bodily pain, disease, or infirmity to any person may be considered to have caused hurt, subject to proof of unlawful conduct and intention."
    },
    {
        "content_type": "case",
        "category": "criminal",
        "title": "Criminal Case Principle — Reasonable Doubt",
        "content": "In criminal proceedings, where the evidence creates reasonable doubt regarding the guilt of the accused, the accused is entitled to the benefit of that doubt."
    },

    # ======================
    # CIVIL - STATUTES / CASES
    # ======================
    {
        "content_type": "statute",
        "category": "civil",
        "title": "Civil Procedure — Plaint",
        "content": "A civil action begins with a plaint setting out the material facts, cause of action, parties, jurisdiction, and relief claimed by the plaintiff."
    },
    {
        "content_type": "case",
        "category": "civil",
        "title": "Civil Case Principle — Damages",
        "content": "A party claiming damages in a civil action must establish loss, causation, and legal responsibility of the defendant."
    },
    {
        "content_type": "case",
        "category": "civil",
        "title": "Negligence Principle",
        "content": "To succeed in negligence, the plaintiff must prove duty of care, breach of that duty, causation, and resulting damage."
    },

    # ======================
    # CONTRACT - STATUTES / CASES
    # ======================
    {
        "content_type": "statute",
        "category": "contract",
        "title": "Contract Law — Offer and Acceptance",
        "content": "A valid contract is formed where there is a lawful offer, unconditional acceptance, consideration, and intention to create legal relations."
    },
    {
        "content_type": "case",
        "category": "contract",
        "title": "Contract Case Principle — Breach",
        "content": "Where one party fails to perform a contractual obligation, the other party may claim remedies such as damages or specific performance."
    },
    {
        "content_type": "case",
        "category": "contract",
        "title": "Specific Performance Principle",
        "content": "Specific performance may be granted where damages are inadequate and the contractual obligation can fairly be enforced."
    },

    # ======================
    # PROPERTY - STATUTES / CASES
    # ======================
    {
        "content_type": "statute",
        "category": "property",
        "title": "Prevention of Frauds — Property Transfer",
        "content": "Certain transactions relating to immovable property must be in writing and properly executed before a notary and witnesses."
    },
    {
        "content_type": "case",
        "category": "property",
        "title": "Property Case Principle — Boundaries",
        "content": "In a boundary dispute, deeds, survey plans, possession, and physical boundaries may be considered to determine the true extent of land."
    },
    {
        "content_type": "case",
        "category": "property",
        "title": "Possession Principle",
        "content": "Long and peaceful possession of land may support a claim of ownership depending on the facts and applicable law."
    },

    # ======================
    # FAMILY - STATUTES / CASES
    # ======================
    {
        "content_type": "statute",
        "category": "family",
        "title": "Family Law — Maintenance",
        "content": "A person with legal responsibility may be required to provide maintenance for a spouse, child, or dependent according to law."
    },
    {
        "content_type": "case",
        "category": "family",
        "title": "Custody Case Principle",
        "content": "In custody matters, the welfare and best interests of the child are treated as the primary consideration by court."
    },
    {
        "content_type": "case",
        "category": "family",
        "title": "Access to Child Principle",
        "content": "Access to a child may be granted subject to conditions that protect the welfare, safety, and emotional wellbeing of the child."
    },
]


def main():
    print("Connecting to database...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print(f"Adding {len(items)} statutes/cases...")

    for index, item in enumerate(items, start=1):
        print(f"Creating embedding {index}/{len(items)}: {item['title']}")

        embedding = get_embedding(item["content"])
        embedding_json = json.dumps(embedding.tolist())

        cursor.execute(
            """
            INSERT INTO legal_content
            (content_type, category, title, content, embedding)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                item["content_type"],
                item["category"],
                item["title"],
                item["content"],
                embedding_json,
            )
        )

    conn.commit()
    cursor.close()
    conn.close()

    print("Done. Statutes and cases added successfully.")


if __name__ == "__main__":
    main()