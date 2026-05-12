"""
Curated mental health content from NIMH (National Institute of Mental Health)
and APA (American Psychological Association) public domain resources.
"""

CONDITIONS = [
    {
        "id": "anxiety",
        "title": "Anxiety Disorders",
        "icon": "pulse-outline",
        "color": "#2E6A7E",
        "bg": "#EEF6F9",
        "tagline": "More than everyday worry",
        "overview": "Anxiety disorders are the most common mental health conditions in the United States, affecting more than 40 million adults. They involve more than temporary worry or fear — for people with anxiety disorders, the anxiety does not go away and can worsen over time.",
        "symptoms": [
            "Feeling restless, wound-up, or on edge",
            "Being easily fatigued",
            "Having difficulty concentrating",
            "Being irritable",
            "Having headaches, muscle tension, or stomach problems",
            "Difficulty sleeping or staying asleep",
            "Experiencing sudden intense fear (panic attacks)",
        ],
        "types": ["Generalized Anxiety Disorder (GAD)", "Panic Disorder", "Social Anxiety Disorder", "Specific Phobias"],
        "when_to_seek_help": "Seek help if anxiety is interfering with your daily life, relationships, or work for more than 6 months, or if you are avoiding situations because of fear.",
        "treatments": ["Cognitive Behavioral Therapy (CBT)", "Medication (SSRIs, SNRIs)", "Relaxation techniques", "Mindfulness-based therapies"],
        "source": "NIMH — National Institute of Mental Health",
    },
    {
        "id": "depression",
        "title": "Depression",
        "icon": "cloud-outline",
        "color": "#6BAF92",
        "bg": "#EEF7F2",
        "tagline": "More than sadness",
        "overview": "Depression (major depressive disorder) is a common and serious medical illness that negatively affects how you feel, the way you think, and how you act. It causes persistent feelings of sadness and loss of interest and can lead to various emotional and physical problems.",
        "symptoms": [
            "Persistent sad, anxious, or empty mood",
            "Feelings of hopelessness or pessimism",
            "Irritability, frustration, or restlessness",
            "Loss of interest or pleasure in activities",
            "Decreased energy or fatigue",
            "Difficulty concentrating, remembering, or making decisions",
            "Changes in appetite or weight",
            "Thoughts of death or suicide",
        ],
        "types": ["Major Depressive Disorder", "Persistent Depressive Disorder", "Postpartum Depression", "Seasonal Affective Disorder"],
        "when_to_seek_help": "Seek help if you have had depressive symptoms for more than 2 weeks, especially if you are having thoughts of self-harm or suicide. Call 988 immediately if you are in crisis.",
        "treatments": ["Psychotherapy (CBT, interpersonal therapy)", "Antidepressant medications", "Brain stimulation therapies", "Exercise and lifestyle changes"],
        "source": "NIMH — National Institute of Mental Health",
    },
    {
        "id": "ptsd",
        "title": "PTSD / Trauma",
        "icon": "shield-outline",
        "color": "#8B6BAF",
        "bg": "#F7EEF9",
        "tagline": "A normal response to abnormal events",
        "overview": "Post-traumatic stress disorder (PTSD) is a disorder that develops in some people who have experienced a shocking, scary, or dangerous event. It is natural to feel afraid during and after a traumatic situation. PTSD can occur in people of any age.",
        "symptoms": [
            "Flashbacks — reliving the trauma through intrusive memories",
            "Nightmares and sleep disturbances",
            "Severe emotional distress when reminded of the event",
            "Avoiding thoughts, feelings, or reminders of the trauma",
            "Negative changes in thinking and mood",
            "Feeling detached from others",
            "Being easily startled or feeling on guard (hypervigilance)",
            "Angry outbursts or irritability",
        ],
        "types": ["Acute Stress Disorder", "Complex PTSD (C-PTSD)", "Secondary Traumatic Stress"],
        "when_to_seek_help": "Seek help if symptoms last more than a month after the traumatic event, or if they are severe enough to interfere with your daily life and relationships.",
        "treatments": ["Prolonged Exposure Therapy", "Cognitive Processing Therapy (CPT)", "EMDR (Eye Movement Desensitization and Reprocessing)", "Medication (SSRIs)"],
        "source": "NIMH — National Institute of Mental Health",
    },
    {
        "id": "panic",
        "title": "Panic Attacks",
        "icon": "alert-circle-outline",
        "color": "#E8956A",
        "bg": "#FDF0E8",
        "tagline": "Understanding what is happening in your body",
        "overview": "A panic attack is a sudden episode of intense fear that triggers severe physical reactions when there is no real danger or apparent cause. Panic attacks can be very frightening — when they occur, you might think you are losing control, having a heart attack, or dying.",
        "symptoms": [
            "Rapid, pounding heartbeat",
            "Sweating",
            "Trembling or shaking",
            "Shortness of breath or feeling smothered",
            "Chills or hot flashes",
            "Nausea or stomach cramps",
            "Chest pain",
            "Dizziness or lightheadedness",
            "Feeling of unreality or detachment",
            "Fear of losing control or dying",
        ],
        "types": ["Expected Panic Attacks", "Unexpected Panic Attacks", "Panic Disorder"],
        "when_to_seek_help": "Seek help if you have had more than one panic attack and are living in fear of having another one, or if panic attacks are changing your behaviour.",
        "treatments": ["Cognitive Behavioral Therapy (CBT)", "Breathing retraining", "Medication (SSRIs, benzodiazepines short-term)", "Exposure therapy"],
        "source": "APA — American Psychological Association",
    },
    {
        "id": "substance",
        "title": "Substance Use",
        "icon": "warning-outline",
        "color": "#C0392B",
        "bg": "#FEF0F0",
        "tagline": "A health condition, not a moral failing",
        "overview": "Substance use disorder (SUD) is a complex condition in which there is uncontrolled use of a substance despite harmful consequences. People with SUD have an intense focus on using a certain substance to the point where it takes over their life. It is a medical condition that affects brain function and behavior.",
        "symptoms": [
            "Inability to stop or control use despite wanting to",
            "Spending large amounts of time getting, using, or recovering",
            "Cravings and urges to use the substance",
            "Neglecting responsibilities at work, school, or home",
            "Continuing to use despite relationship or health problems",
            "Giving up activities that were once important",
            "Using in physically dangerous situations",
            "Needing more of the substance to get the same effect (tolerance)",
        ],
        "types": ["Alcohol Use Disorder", "Opioid Use Disorder", "Cannabis Use Disorder", "Stimulant Use Disorder"],
        "when_to_seek_help": "Seek help as soon as you notice substance use is affecting your health, relationships, or responsibilities. Early treatment leads to better outcomes.",
        "treatments": ["Behavioral therapies (CBT, motivational interviewing)", "Medication-assisted treatment (MAT)", "Support groups (AA, NA)", "Residential or outpatient programs"],
        "source": "NIMH — National Institute of Mental Health",
    },
    {
        "id": "anger",
        "title": "Anger Management",
        "icon": "flame-outline",
        "color": "#E05C5C",
        "bg": "#FEF0F0",
        "tagline": "Learning to respond, not react",
        "overview": "Anger is a normal emotion, but when it becomes frequent, intense, or leads to harmful behavior, it may be a sign of an underlying issue. Chronic anger can damage relationships, affect physical health, and impact overall quality of life.",
        "symptoms": [
            "Feeling angry frequently or intensely",
            "Difficulty controlling anger once triggered",
            "Physical reactions such as increased heart rate or tension",
            "Saying or doing things you later regret",
            "Feeling that others make you angry",
            "Anger lasting for extended periods",
            "Passive-aggressive behavior",
            "Road rage or other intense anger reactions",
        ],
        "types": ["Intermittent Explosive Disorder (IED)", "Reactive Aggression", "Displaced Aggression"],
        "when_to_seek_help": "Seek help if your anger is hurting your relationships, causing legal or work problems, or leading to physical aggression or self-harm.",
        "treatments": ["Anger management therapy", "Cognitive Behavioral Therapy (CBT)", "Relaxation techniques", "Communication skills training"],
        "source": "APA — American Psychological Association",
    },
]

# Extended content for richer RAG answers
EXTENDED_CONTENT = {
    "anxiety": [
        ("causes", "Anxiety disorders are caused by a combination of genetic factors, brain chemistry, personality, and life events. Traumatic or stressful experiences, family history of anxiety, and certain medical conditions can all contribute. The brain's fight-or-flight response becomes overactivated, causing the body to react to non-threatening situations as if they were dangerous."),
        ("recognition", "You may have an anxiety disorder if you worry excessively about many things most days for at least 6 months, find it hard to control your worry, and the anxiety interferes with daily activities. Physical signs include a racing heart, sweating, trembling, and trouble breathing. Unlike normal stress, anxiety disorders do not go away on their own."),
        ("daily_impact", "Anxiety can affect sleep, concentration, relationships, and work performance. Many people with anxiety avoid situations that trigger their fear, which can limit their lives significantly. It is one of the most treatable mental health conditions with the right support."),
        ("risk_factors", "Risk factors for anxiety include a history of trauma, chronic stress, certain personality types (perfectionists or those with low self-esteem), other mental health conditions, and substance use. Women are diagnosed with anxiety disorders more often than men."),
    ],
    "depression": [
        ("causes", "Depression is caused by a combination of genetic, biological, environmental, and psychological factors. Brain chemistry changes, hormonal imbalances, family history, trauma, loss, and major life changes can all contribute. It is not a character flaw or weakness — it is a medical condition."),
        ("recognition", "You may be experiencing depression if you have felt persistently sad, empty, or hopeless for at least 2 weeks, have lost interest in things you used to enjoy, and these feelings are affecting your daily life. Depression looks different in different people — some feel deeply sad, others feel numb or irritable. A doctor or mental health professional can make a proper assessment."),
        ("daily_impact", "Depression affects every aspect of life — work, relationships, physical health, and self-care. It is not something you can simply snap out of. Even small tasks like getting out of bed or eating can feel overwhelming. With proper treatment, most people with depression see significant improvement."),
        ("risk_factors", "Risk factors include a personal or family history of depression, major life changes or trauma, chronic illness, certain medications, substance use, and low self-esteem. Postpartum depression affects many new mothers. Depression can occur at any age."),
        ("self_assessment", "The PHQ-9 is a validated 9-question tool used by doctors to assess depression severity. Questions ask how often in the past 2 weeks you have experienced low mood, loss of interest, sleep problems, fatigue, appetite changes, feelings of worthlessness, concentration difficulties, and thoughts of self-harm."),
    ],
    "ptsd": [
        ("causes", "PTSD develops after exposure to a traumatic event such as combat, sexual assault, natural disaster, serious accident, or witnessing violence. Not everyone who experiences trauma develops PTSD — factors like the severity of the trauma, available support, and personal resilience all play a role."),
        ("recognition", "Signs that you may have PTSD include intrusive memories or flashbacks of the event, nightmares, emotional numbness, feeling constantly on guard, avoiding reminders of the trauma, and negative changes in mood and thinking. Symptoms typically begin within 3 months of the traumatic event."),
        ("daily_impact", "PTSD can make it difficult to maintain relationships, hold a job, and engage in everyday activities. Many people with PTSD feel disconnected from others and struggle to experience positive emotions. Effective treatments are available and most people improve with therapy."),
        ("risk_factors", "Risk factors include experiencing severe or prolonged trauma, lack of social support after trauma, a history of mental health problems, and genetic vulnerability. First responders, military personnel, and survivors of abuse are at higher risk."),
    ],
    "panic": [
        ("causes", "Panic attacks involve a sudden surge of intense fear that triggers severe physical reactions. They are caused by the nervous system's fight-or-flight response activating without a clear threat. Genetics, major stress, and certain medical conditions can increase the likelihood of panic attacks."),
        ("recognition", "A panic attack typically peaks within 10 minutes and involves a racing heart, sweating, trembling, shortness of breath, chest pain, dizziness, and an intense fear of dying or losing control. If you have repeated panic attacks and live in fear of the next one, you may have panic disorder."),
        ("daily_impact", "Panic disorder can lead to agoraphobia — avoiding places or situations where you fear a panic attack might occur. This can significantly restrict your daily life. The good news is panic disorder responds very well to cognitive behavioral therapy."),
    ],
    "substance": [
        ("causes", "Substance use disorders develop through a combination of genetic vulnerability, environmental factors, and changes in brain chemistry. Repeated substance use changes how the brain experiences pleasure and handles stress, making it increasingly difficult to feel normal without the substance."),
        ("recognition", "Signs of a substance use disorder include using more than intended, failed attempts to cut down, spending significant time obtaining or recovering from use, cravings, neglecting responsibilities, and continuing despite negative consequences. Withdrawal symptoms when stopping are a key sign of physical dependence."),
        ("daily_impact", "Substance use disorders affect health, relationships, finances, and employment. They are medical conditions, not moral failings. Recovery is possible with the right support, and many people achieve long-term sobriety with treatment."),
    ],
    "anger": [
        ("causes", "Problematic anger can result from stress, unresolved trauma, learned behavior, low frustration tolerance, or underlying mental health conditions like depression. Neurological factors and substance use can also contribute to difficulties regulating anger."),
        ("recognition", "Signs that anger may be a problem include frequent intense anger that feels hard to control, regretting things said or done in anger, anger causing problems at work or in relationships, and physical symptoms like muscle tension or rapid heartbeat when angry."),
        ("daily_impact", "Chronic anger raises blood pressure, weakens the immune system, and increases the risk of heart disease. It damages relationships and can lead to legal and work problems. Anger management therapy is highly effective and can teach healthier ways to express and process emotions."),
    ],
}

# Flat chunks for RAG embedding
def get_rag_chunks():
    chunks = []
    for c in CONDITIONS:
        chunks.append({
            "id": f"{c['id']}_overview",
            "condition": c["id"],
            "text": f"{c['title']}: {c['overview']}",
            "source": c["source"],
        })
        chunks.append({
            "id": f"{c['id']}_symptoms",
            "condition": c["id"],
            "text": f"How to recognise {c['title']} — symptoms include: {', '.join(c['symptoms'])}",
            "source": c["source"],
        })
        chunks.append({
            "id": f"{c['id']}_treatment",
            "condition": c["id"],
            "text": f"{c['title']} treatments: {', '.join(c['treatments'])}. When to seek help: {c['when_to_seek_help']}",
            "source": c["source"],
        })
        if c.get("types"):
            chunks.append({
                "id": f"{c['id']}_types",
                "condition": c["id"],
                "text": f"Types of {c['title']}: {', '.join(c['types'])}",
                "source": c["source"],
            })
        # Add extended content chunks
        for topic, text in EXTENDED_CONTENT.get(c["id"], []):
            chunks.append({
                "id": f"{c['id']}_{topic}",
                "condition": c["id"],
                "text": text,
                "source": c["source"],
            })
    return chunks
