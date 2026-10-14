-- 100 billable ICD-10-CM diagnosis codes (FY2027 code set).
-- Codes and descriptions verified against https://www.icd10data.com/ICD10CM/Codes
-- Idempotent: INSERT OR IGNORE makes it safe to run more than once.

-- A00-B99 Certain infectious and parasitic diseases
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('A08.4', 'Viral intestinal infection, unspecified'),
  ('A09', 'Infectious gastroenteritis and colitis, unspecified'),
  ('A41.9', 'Sepsis, unspecified organism'),
  ('B02.9', 'Zoster without complications'),
  ('B34.9', 'Viral infection, unspecified'),
  ('B35.1', 'Tinea unguium');

-- C00-D89 Neoplasms; diseases of the blood and blood-forming organs
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('C34.90', 'Malignant neoplasm of unspecified part of unspecified bronchus or lung'),
  ('C50.911', 'Malignant neoplasm of unspecified site of right female breast'),
  ('C61', 'Malignant neoplasm of prostate'),
  ('D50.9', 'Iron deficiency anemia, unspecified'),
  ('D64.9', 'Anemia, unspecified'),
  ('D69.6', 'Thrombocytopenia, unspecified');

-- E00-E89 Endocrine, nutritional and metabolic diseases
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('E03.9', 'Hypothyroidism, unspecified'),
  ('E10.9', 'Type 1 diabetes mellitus without complications'),
  ('E11.65', 'Type 2 diabetes mellitus with hyperglycemia'),
  ('E11.9', 'Type 2 diabetes mellitus without complications'),
  ('E55.9', 'Vitamin D deficiency, unspecified'),
  ('E66.9', 'Obesity, unspecified'),
  ('E78.00', 'Pure hypercholesterolemia, unspecified'),
  ('E78.5', 'Hyperlipidemia, unspecified'),
  ('E86.0', 'Dehydration');

-- F01-F99 Mental, behavioral and neurodevelopmental disorders
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('F10.20', 'Alcohol dependence, uncomplicated'),
  ('F17.210', 'Nicotine dependence, cigarettes, uncomplicated'),
  ('F32.9', 'Major depressive disorder, single episode, unspecified'),
  ('F41.1', 'Generalized anxiety disorder'),
  ('F41.9', 'Anxiety disorder, unspecified'),
  ('F43.10', 'Post-traumatic stress disorder, unspecified'),
  ('F51.01', 'Primary insomnia'),
  ('F90.0', 'Attention-deficit hyperactivity disorder, predominantly inattentive type');

-- G00-G99 Diseases of the nervous system
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('G20.A1', 'Parkinson''s disease without dyskinesia, without mention of fluctuations'),
  ('G40.909', 'Epilepsy, unspecified, not intractable, without status epilepticus'),
  ('G43.909', 'Migraine, unspecified, not intractable, without status migrainosus'),
  ('G47.33', 'Obstructive sleep apnea (adult) (pediatric)'),
  ('G56.00', 'Carpal tunnel syndrome, unspecified upper limb');

-- H00-H95 Diseases of the eye and adnexa; ear and mastoid process
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('H10.9', 'Unspecified conjunctivitis'),
  ('H40.9', 'Unspecified glaucoma'),
  ('H61.20', 'Impacted cerumen, unspecified ear'),
  ('H66.90', 'Otitis media, unspecified, unspecified ear');

-- I00-I99 Diseases of the circulatory system
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('I10', 'Essential (primary) hypertension'),
  ('I21.9', 'Acute myocardial infarction, unspecified'),
  ('I25.10', 'Atherosclerotic heart disease of native coronary artery without angina pectoris'),
  ('I48.91', 'Unspecified atrial fibrillation'),
  ('I50.9', 'Heart failure, unspecified'),
  ('I63.9', 'Cerebral infarction, unspecified'),
  ('I95.9', 'Hypotension, unspecified');

-- J00-J99 Diseases of the respiratory system
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('J01.90', 'Acute sinusitis, unspecified'),
  ('J02.9', 'Acute pharyngitis, unspecified'),
  ('J06.9', 'Acute upper respiratory infection, unspecified'),
  ('J11.1', 'Influenza due to unidentified influenza virus with other respiratory manifestations'),
  ('J18.9', 'Pneumonia, unspecified organism'),
  ('J20.9', 'Acute bronchitis, unspecified'),
  ('J30.9', 'Allergic rhinitis, unspecified'),
  ('J44.9', 'Chronic obstructive pulmonary disease, unspecified'),
  ('J45.909', 'Unspecified asthma, uncomplicated');

-- K00-K95 Diseases of the digestive system
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('K21.9', 'Gastro-esophageal reflux disease without esophagitis'),
  ('K29.70', 'Gastritis, unspecified, without bleeding'),
  ('K52.9', 'Noninfective gastroenteritis and colitis, unspecified'),
  ('K58.9', 'Irritable bowel syndrome, unspecified'),
  ('K59.00', 'Constipation, unspecified'),
  ('K76.0', 'Fatty (change of) liver, not elsewhere classified'),
  ('K80.20', 'Calculus of gallbladder without cholecystitis without obstruction');

-- L00-L99 Diseases of the skin and subcutaneous tissue
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('L03.90', 'Cellulitis, unspecified'),
  ('L20.9', 'Atopic dermatitis, unspecified'),
  ('L40.0', 'Psoriasis vulgaris'),
  ('L50.9', 'Urticaria, unspecified'),
  ('L70.0', 'Acne vulgaris');

-- M00-M99 Diseases of the musculoskeletal system and connective tissue
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('M06.9', 'Rheumatoid arthritis, unspecified'),
  ('M10.9', 'Gout, unspecified'),
  ('M17.11', 'Unilateral primary osteoarthritis, right knee'),
  ('M25.561', 'Pain in right knee'),
  ('M54.2', 'Cervicalgia'),
  ('M54.50', 'Low back pain, unspecified'),
  ('M79.10', 'Myalgia, unspecified site');

-- N00-N99 Diseases of the genitourinary system
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('N18.9', 'Chronic kidney disease, unspecified'),
  ('N20.0', 'Calculus of kidney'),
  ('N39.0', 'Urinary tract infection, site not specified'),
  ('N40.0', 'Benign prostatic hyperplasia without lower urinary tract symptoms');

-- O00-O9A Pregnancy, childbirth and the puerperium
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('O80', 'Encounter for full-term uncomplicated delivery');

-- P00-P96 Certain conditions originating in the perinatal period
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('P59.9', 'Neonatal jaundice, unspecified');

-- R00-R99 Symptoms, signs and abnormal clinical and laboratory findings
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('R05.9', 'Cough, unspecified'),
  ('R06.02', 'Shortness of breath'),
  ('R07.9', 'Chest pain, unspecified'),
  ('R10.9', 'Unspecified abdominal pain'),
  ('R11.2', 'Nausea with vomiting, unspecified'),
  ('R42', 'Dizziness and giddiness'),
  ('R50.9', 'Fever, unspecified'),
  ('R51.9', 'Headache, unspecified'),
  ('R53.83', 'Other fatigue');

-- S00-T88 Injury, poisoning and certain other consequences of external causes
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('S06.0X0A', 'Concussion without loss of consciousness, initial encounter'),
  ('S52.501A', 'Unspecified fracture of the lower end of right radius, initial encounter for closed fracture'),
  ('S93.401A', 'Sprain of unspecified ligament of right ankle, initial encounter'),
  ('T14.90XA', 'Injury, unspecified, initial encounter'),
  ('T78.40XA', 'Allergy, unspecified, initial encounter');

-- U00-U85 Codes for special purposes
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('U07.1', 'COVID-19');

-- Z00-Z99 Factors influencing health status and contact with health services
INSERT OR IGNORE INTO diagnosis_codes (code, description) VALUES
  ('Z00.00', 'Encounter for general adult medical examination without abnormal findings'),
  ('Z00.129', 'Encounter for routine child health examination without abnormal findings'),
  ('Z23', 'Encounter for immunization'),
  ('Z34.90', 'Encounter for supervision of normal pregnancy, unspecified, unspecified trimester'),
  ('Z79.4', 'Long term (current) use of insulin'),
  ('Z87.891', 'Personal history of nicotine dependence');
