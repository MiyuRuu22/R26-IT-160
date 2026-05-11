import psycopg2
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"


phrases = [
    {
        "category": "criminal",
        "title": "Charge — Murder",
        "content": "The accused did unlawfully and with malice aforethought cause the death of the deceased."
    },
    {
        "category": "criminal",
        "title": "Charge — Assault",
        "content": "The accused did unlawfully assault and cause bodily harm to the complainant contrary to law."
    },
    {
        "category": "criminal",
        "title": "Bail Application",
        "content": "The accused respectfully submits that he poses no flight risk and has strong community ties and therefore seeks release on bail pending trial."
    },
    {
        "category": "criminal",
        "title": "Burden of Proof",
        "content": "The prosecution bears the burden of proving the guilt of the accused beyond reasonable doubt."
    },
    {
        "category": "civil",
        "title": "Plaint Opening",
        "content": "The plaintiff respectfully submits that the defendant is liable in damages for the wrongful acts complained of herein."
    },
    {
        "category": "civil",
        "title": "Negligence Claim",
        "content": "The defendant owed the plaintiff a duty of care which was breached causing the plaintiff to suffer loss and damage."
    },
    {
        "category": "civil",
        "title": "Damages Claim",
        "content": "By reason of the matters aforesaid the plaintiff has suffered loss and damage and claims compensation from the defendant."
    },
    {
        "category": "contract",
        "title": "Breach of Contract",
        "content": "The defendant breached the terms and conditions of the agreement by failing to perform contractual obligations."
    },
    {
        "category": "contract",
        "title": "Contract Formation",
        "content": "A valid and binding contract was entered into between the parties upon offer, acceptance, and consideration."
    },
    {
        "category": "contract",
        "title": "Specific Performance",
        "content": "The plaintiff seeks an order for specific performance compelling the defendant to fulfil the contractual obligations agreed upon."
    },
    {
        "category": "property",
        "title": "Property Transfer",
        "content": "The vendor transfers and conveys unto the purchaser the land and premises described in the schedule free from encumbrances."
    },
    {
        "category": "property",
        "title": "Deed Attestation",
        "content": "This deed is executed by the parties in the presence of the Notary Public and attesting witnesses."
    },
    {
        "category": "property",
        "title": "Vacant Possession",
        "content": "The vendor shall deliver vacant possession of the property to the purchaser on the date of completion."
    },
    {
        "category": "family",
        "title": "Divorce Petition",
        "content": "The petitioner seeks dissolution of the marriage on the grounds of irretrievable breakdown between the parties."
    },
    {
        "category": "family",
        "title": "Maintenance Claim",
        "content": "The petitioner seeks an order for maintenance from the respondent for the support and welfare of the minor children."
    },
    {
        "category": "family",
        "title": "Custody Application",
        "content": "The petitioner seeks custody of the minor children having regard to their best interests and welfare."
    }
]


def main():
    print("Connecting to database...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print(f"Adding {len(phrases)} legal phrases...")

    for index, phrase in enumerate(phrases, start=1):
        print(f"Creating embedding {index}/{len(phrases)}: {phrase['title']}")

        embedding = get_embedding(phrase["content"])
        embedding_json = json.dumps(embedding.tolist())

        cursor.execute(
            """
            INSERT INTO legal_content
            (content_type, category, title, content, embedding)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                "phrase",
                phrase["category"],
                phrase["title"],
                phrase["content"],
                embedding_json
            )
        )

    conn.commit()
    cursor.close()
    conn.close()

    print("Done. All sample legal phrases added successfully.")


if __name__ == "__main__":
    main()