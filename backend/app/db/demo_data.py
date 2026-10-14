"""Sample consultations for a fresh demo database.

The patients are fictional. Every code is in sql/seed_diagnosis_codes.sql. Some patients
have two visits and several notes share a code family (E11), so both kinds of search have
something to find.
"""

from dataclasses import dataclass
from datetime import date, timedelta, timezone

# Visit times are clinic opening hours in this zone (UTC+7, the team's time zone); they are
# stored in UTC like every other timestamp.
CLINIC_TZ = timezone(timedelta(hours=7))


@dataclass(frozen=True)
class DemoConsultation:
    patient_name: str
    patient_dob: date | None
    # When the visit happened: this many days before seeding, at this clinic (CLINIC_TZ) time.
    days_ago: int
    at: tuple[int, int]
    codes: tuple[str, ...]
    notes: str


DEMO_CONSULTATIONS: tuple[DemoConsultation, ...] = (
    DemoConsultation(
        "Margaret Holloway",
        date(1956, 3, 14),
        1,
        (9, 15),
        ("E11.65", "I10"),
        "Diabetes follow-up. HbA1c 8.4%, up from 7.6% in the spring; home BP 148/92. "
        "Increase metformin to 1 g twice daily and start amlodipine 5 mg once daily. "
        "Recheck HbA1c and renal function in 3 months.",
    ),
    DemoConsultation(
        "Daniel Okafor",
        date(1988, 7, 22),
        1,
        (10, 40),
        ("J06.9", "R05.9"),
        "Three days of sore throat, runny nose and dry cough. Afebrile, chest clear, "
        "SpO2 98%. Supportive care and fluids. Return if fever, breathlessness or no "
        "improvement after 7 days.",
    ),
    DemoConsultation(
        "Sofia Marquez",
        date(1994, 11, 3),
        2,
        (14, 5),
        ("G43.909",),
        "Recurrent migraine without aura, 3 to 4 attacks a month, each lasting most of a "
        "day. Neurological exam normal. Sumatriptan 50 mg as needed; keep a headache "
        "diary and review in 6 weeks.",
    ),
    DemoConsultation(
        "Harold Jensen",
        date(1949, 1, 30),
        3,
        (11, 20),
        ("I48.91", "I50.9"),
        "Ankle swelling and breathlessness on one flight of stairs. Irregular pulse 96, "
        "bibasal crackles. ECG shows atrial fibrillation. Start furosemide 40 mg daily, "
        "echocardiogram requested, review in 1 week.",
    ),
    DemoConsultation(
        "Aisha Rahman",
        date(1979, 5, 18),
        4,
        (15, 30),
        ("E03.9", "R53.83"),
        "Two months of tiredness and feeling cold. TSH 9.8 mU/L with low free T4. Start "
        "levothyroxine 50 mcg daily, repeat thyroid tests in 6 weeks.",
    ),
    DemoConsultation(
        "Liam O'Connor",
        date(2001, 9, 9),
        5,
        (17, 10),
        ("S93.401A",),
        "Rolled right ankle playing football yesterday. Swelling over the lateral "
        "ligament, able to bear weight, no bony tenderness (Ottawa rules negative). "
        "Rest, ice, compression; ibuprofen 400 mg three times daily for 5 days.",
    ),
    DemoConsultation(
        "Priya Nair",
        date(1990, 2, 27),
        6,
        (9, 0),
        ("Z34.90",),
        "Routine antenatal visit at 20 weeks. BP 112/70, urine dipstick clear, fundal "
        "height matches dates. Anomaly scan booked for next week.",
    ),
    DemoConsultation(
        "Thomas Becker",
        date(1965, 12, 12),
        7,
        (13, 45),
        ("M54.50",),
        "Low back pain since lifting boxes four days ago, no leg pain. No red flags: "
        "bladder and bowel normal, no numbness. Stay active, ibuprofen for 1 week, "
        "physiotherapy referral if not better in 2 weeks.",
    ),
    DemoConsultation(
        "Grace Whitfield",
        date(2019, 4, 2),
        9,
        (10, 0),
        ("Z00.129", "Z23"),
        "Routine check before school entry. Growth on the 60th centile, development "
        "normal. Pre-school booster vaccines given; no reaction during 15 minutes of "
        "observation.",
    ),
    DemoConsultation(
        "Ethan Brooks",
        date(1972, 8, 15),
        12,
        (16, 20),
        ("E11.9", "F17.210"),
        "New diagnosis of type 2 diabetes: HbA1c 7.1% on two tests. Smokes 15 cigarettes "
        "a day and wants to stop. Start metformin 500 mg daily; referred to diabetes "
        "education and the stop-smoking service.",
    ),
    DemoConsultation(
        "Nora Lindqvist",
        date(1985, 6, 6),
        14,
        (11, 0),
        ("F41.1", "F51.01"),
        "Six months of constant worry and trouble falling asleep, affecting work. No "
        "thoughts of self-harm. Referred for CBT; start sertraline 50 mg daily. Review "
        "in 4 weeks.",
    ),
    DemoConsultation(
        "Samuel Adeyemi",
        date(1958, 10, 21),
        16,
        (8, 50),
        ("J44.9", "J20.9"),
        "COPD with five days of more cough and green sputum. Wheeze on both sides, SpO2 "
        "93% on air. Prednisolone 30 mg for 5 days and doxycycline. Check inhaler "
        "technique at the next visit.",
    ),
    DemoConsultation(
        "Chloe Dubois",
        date(1997, 3, 11),
        19,
        (12, 30),
        ("N39.0",),
        "Burning on passing urine and frequency for two days, no fever or loin pain. "
        "Urine dipstick positive for nitrites. Nitrofurantoin 100 mg twice daily for "
        "3 days.",
    ),
    DemoConsultation(
        "Mateo Rossi",
        date(1983, 12, 1),
        22,
        (14, 50),
        ("K21.9",),
        "Heartburn after meals and at night for several weeks. No weight loss, no "
        "trouble swallowing. Omeprazole 20 mg daily for 8 weeks; smaller evening meals.",
    ),
    DemoConsultation(
        "Ruth Abernathy",
        date(1941, 7, 7),
        26,
        (10, 10),
        ("N18.9", "D64.9"),
        "Chronic kidney disease review. eGFR 41, stable. Haemoglobin 10.6 g/dL; iron "
        "studies and B12 requested. Continue current medicines, review results in "
        "2 weeks.",
    ),
    DemoConsultation(
        "Margaret Holloway",
        date(1956, 3, 14),
        29,
        (9, 30),
        ("E11.9", "E78.5"),
        "Annual diabetes review. HbA1c 7.6%, LDL cholesterol 3.4 mmol/L. Feet and eyes "
        "checked, no problems. Start atorvastatin 20 mg at night.",
    ),
    DemoConsultation(
        "Harold Jensen",
        date(1949, 1, 30),
        33,
        (11, 0),
        ("I10", "I25.10"),
        "Blood pressure review. 136/84 on ramipril 5 mg. Known coronary artery disease, "
        "no chest pain. Continue aspirin and atorvastatin.",
    ),
)
