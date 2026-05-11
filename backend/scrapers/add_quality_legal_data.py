import psycopg2
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"


legal_items = [
    # ======================
    # CRIMINAL
    # ======================
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Murder Charge",
        "content": "The accused did intentionally and unlawfully cause the death of the deceased, and the prosecution must prove the act and intention beyond reasonable doubt."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Assault and Hurt",
        "content": "The accused unlawfully assaulted the complainant and caused bodily harm, and such conduct constitutes a criminal offence punishable by law."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Bail Application",
        "content": "The accused respectfully seeks bail on the basis that he is not a flight risk, has a fixed residence, and will comply with all conditions imposed by court."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Burden of Proof",
        "content": "In a criminal trial, the prosecution bears the burden of proving the guilt of the accused beyond reasonable doubt."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Presumption of Innocence",
        "content": "The accused is presumed innocent until proven guilty according to law, and any reasonable doubt must operate in favour of the accused."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Criminal Intention",
        "content": "The prosecution must establish that the accused possessed the necessary criminal intention or knowledge at the time of committing the alleged act."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Theft Allegation",
        "content": "The accused dishonestly removed movable property from the possession of the complainant without consent and with intention to cause wrongful loss."
    },
    {
        "content_type": "phrase",
        "category": "criminal",
        "title": "Evidence in Criminal Case",
        "content": "The evidence led by the prosecution must be credible, consistent, and sufficient to establish each element of the offence charged."
    },

    # ======================
    # CIVIL
    # ======================
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Plaint Opening",
        "content": "The plaintiff respectfully states that the defendant is liable for the wrongful acts complained of and claims relief from court."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Civil Damages",
        "content": "The plaintiff has suffered loss and damage by reason of the defendant's wrongful conduct and is entitled to compensation."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Negligence Claim",
        "content": "The defendant owed a duty of care to the plaintiff, breached that duty, and thereby caused loss and damage to the plaintiff."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Cause of Action",
        "content": "The facts pleaded disclose a valid cause of action against the defendant and justify the relief sought by the plaintiff."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Injunction Request",
        "content": "The plaintiff seeks an interim injunction restraining the defendant from continuing the disputed conduct until final determination of the matter."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Civil Liability",
        "content": "The defendant is civilly liable for the loss caused to the plaintiff as a direct and foreseeable consequence of the defendant's actions."
    },
    {
        "content_type": "phrase",
        "category": "civil",
        "title": "Answer to Plaint",
        "content": "The defendant denies the allegations contained in the plaint and states that the plaintiff is not entitled to the relief claimed."
    },

    # ======================
    # CONTRACT
    # ======================
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Contract Formation",
        "content": "A valid contract requires offer, acceptance, consideration, capacity, and intention to create legal relations between the parties."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Breach of Contract",
        "content": "The defendant breached the agreement by failing to perform the contractual obligations undertaken under the terms of the contract."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Specific Performance",
        "content": "The plaintiff seeks specific performance compelling the defendant to perform the contractual obligation as agreed between the parties."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Contract Damages",
        "content": "The innocent party is entitled to damages for loss suffered as a natural consequence of the breach of contract."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Termination Clause",
        "content": "Either party may terminate the agreement upon material breach by giving written notice in accordance with the terms of the contract."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Offer and Acceptance",
        "content": "The agreement became binding when the offer made by one party was accepted by the other party without material variation."
    },
    {
        "content_type": "phrase",
        "category": "contract",
        "title": "Consideration",
        "content": "Consideration is an essential element of a valid contract and represents the value exchanged between the contracting parties."
    },

    # ======================
    # PROPERTY
    # ======================
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Property Transfer",
        "content": "The vendor transfers and conveys the described land and premises to the purchaser subject to the terms stated in the deed."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Deed Execution",
        "content": "The deed is executed by the parties before a Notary Public and attesting witnesses in accordance with legal requirements."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Vacant Possession",
        "content": "The vendor shall deliver vacant possession of the property to the purchaser on completion of the transfer."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Boundary Dispute",
        "content": "The dispute concerns the correct boundary of the land and the parties rely on deeds, plans, and survey evidence."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Ownership Claim",
        "content": "The plaintiff claims lawful ownership of the property by virtue of title deeds and continuous possession."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Encumbrance",
        "content": "The property shall be transferred free from mortgages, leases, charges, and other encumbrances unless expressly disclosed."
    },
    {
        "content_type": "phrase",
        "category": "property",
        "title": "Possession of Land",
        "content": "The party in possession claims the right to occupy and enjoy the land without unlawful interference by others."
    },

    # ======================
    # FAMILY
    # ======================
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Divorce Petition",
        "content": "The petitioner seeks dissolution of the marriage on legally recognized grounds and requests appropriate relief from court."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Child Custody",
        "content": "The court should determine custody of the minor child by considering the best interests and welfare of the child."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Maintenance Claim",
        "content": "The petitioner seeks maintenance for the support, education, and welfare of the minor children and dependent spouse."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Matrimonial Dispute",
        "content": "The dispute arises from matrimonial issues between the parties and requires court intervention to determine rights and obligations."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Access to Child",
        "content": "The applicant seeks reasonable access to the minor child subject to conditions that protect the welfare of the child."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Best Interest of Child",
        "content": "In determining custody, maintenance, and access, the best interest of the child remains the paramount consideration."
    },
    {
        "content_type": "phrase",
        "category": "family",
        "title": "Separation Agreement",
        "content": "The parties agree to live separately and settle matters relating to maintenance, property, and custody by mutual agreement."
    },
]


def main():
    print("Connecting to database...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print(f"Adding {len(legal_items)} legal items...")

    for index, item in enumerate(legal_items, start=1):
        print(f"Creating embedding {index}/{len(legal_items)}: {item['title']}")

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

    print("Done. Quality legal data added successfully.")


if __name__ == "__main__":
    main()