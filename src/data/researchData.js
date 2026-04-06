// George Wyatt — BME Research Knowledge Map
// Neural Interface Lab · BU Biomedical Engineering · Senior
// Purpose: maps his scientific domain — concepts, methods, tools, papers, open questions
export const researchData = {
  name: "George Wyatt",
  role: "BU BME '26 · Neural Interface Lab · Research Knowledge Map",
  weeks_tracked: 5,
  apps_connected: ["PubMed", "Lab ELN", "MATLAB", "Python/Jupyter", "Zotero", "Overleaf", "Slack"],
  stats: {
    nudges_sent: 18,       // concepts tracked
    nudges_responded: 12,  // methods proficient in
    actions_proposed: 27,  // papers read this semester
    actions_confirmed: 3,  // open questions active
    profile_completeness: 0.71
  },
  conversation_insights: [
    "George's deepest expertise is flexible electrode array design and chronic neural recording in rodent motor cortex — 2 years of hands-on lab experience",
    "He has a significant gap in deep learning for neural decoding. MIT and Stanford PhD committees will ask about this. He's aware and hasn't addressed it.",
    "PEDOT:PSS conducting polymer coating has come up in Prof. Shen's last 2 lab meetings. George can't speak to it confidently. It's becoming directly relevant to his capstone.",
    "His MATLAB proficiency is high (daily use, 2+ years), but his Python/ML understanding is surface-level — he runs existing code without understanding the mechanics",
    "He's read 23 papers on chronic recording stability but only 4 on biocompatibility testing — an asymmetry that shows in lab discussions",
    "His most original potential contribution: a hypothesis that recording quality degrades due to mechanical neuronal displacement rather than electrode surface changes — partially supported by his Week 8 data"
  ],
  entities: [
    // ── Core expertise (ring 1) ───────────────────────────────────────────────
    {
      id: "e1", name: "Electrode Arrays",
      label: "Flexible · Parylene-C · Core expertise",
      type: "concept", strength: 0.94, orbit_ring: 1,
      source: ["Lab", "Coursework"],
      detail: "George's deepest technical expertise. He's designed and fabricated flexible parylene-C multi-electrode arrays in Prof. Shen's lab. Understands material selection, trace geometry, site sizing, packaging tradeoffs, and yield issues from first principles. 2 years hands-on. Can explain every design choice and failure mode."
    },
    {
      id: "e2", name: "Chronic Recording",
      label: "Motor cortex · Week 8 · SNR degradation",
      type: "concept", strength: 0.91, orbit_ring: 1,
      source: ["Lab", "Literature"],
      detail: "The central challenge of his research: maintaining stable neural recordings over weeks to months in rodent motor cortex. Currently Week 8 of a 12-week study. SNR has dropped in 3 of 8 channels while impedance remains stable — the open question he's most focused on. Knows the literature deeply: Hochberg 2012, Polikov 2005, Kozai 2015."
    },
    {
      id: "e3", name: "Signal Processing",
      label: "LFP · Spike sorting · MATLAB pipeline",
      type: "method", strength: 0.87, orbit_ring: 1,
      source: ["Coursework", "Lab"],
      detail: "Proficient in the full signal processing pipeline: bandpass filtering, spike detection, threshold crossing, PCA-based sorting, LFP spectral analysis. All implemented in MATLAB. Can explain Nyquist, aliasing, and noise floor from first principles. Weakness: doesn't fully understand the statistical assumptions behind PCA-based spike sorting."
    },
    {
      id: "e4", name: "Impedance Spectroscopy",
      label: "EIS · Randles circuit · daily use",
      type: "method", strength: 0.83, orbit_ring: 1,
      source: ["Lab", "Self-taught"],
      detail: "Electrochemical impedance spectroscopy for electrode characterization. George runs EIS on every electrode set before implant. Understands the Randles equivalent circuit model, CPE behavior, and what impedance changes indicate about electrode-tissue interface quality. Personal dataset: 200+ EIS measurements."
    },
    {
      id: "e5", name: "MATLAB",
      label: "Primary tool · 2 yrs · high proficiency",
      type: "tool", strength: 0.92, orbit_ring: 1,
      source: ["Coursework", "Lab", "Self-taught"],
      detail: "George's primary scientific computing environment. Signal processing, data visualization, statistical analysis, and automation scripts all live here. Proficiency is deep — he can debug other people's code, has written reusable lab toolboxes, and thinks in MATLAB. This is where his technical identity lives."
    },
    {
      id: "e6", name: "Glial Response",
      label: "FBR · Scarring · Central obstacle",
      type: "concept", strength: 0.78, orbit_ring: 1,
      source: ["Literature", "Coursework"],
      detail: "The foreign body response (FBR) to chronically implanted electrodes — the primary biological mechanism behind recording degradation. George understands the cellular cascade: acute inflammation → microglia/astrocyte activation → glial scar encapsulation. Gap: molecular biology of cytokine signaling is thin. Papers read: Polikov 2005, Barker 2011, Kozai 2015."
    },
    {
      id: "e13", name: "Prof. Shen's Work",
      label: "12 papers read · primary framework",
      type: "concept", strength: 0.88, orbit_ring: 1,
      source: ["Lab"],
      detail: "Prof. Shen's lab publications form George's primary conceptual framework. He's read all 12 of her papers and 3 conference abstracts. Her focus: flexible polymer-based neural interfaces for chronic motor cortex recording. George thinks about his own work in terms of how it extends her findings. Her research directions shape his."
    },

    // ── Working knowledge (ring 2) ────────────────────────────────────────────
    {
      id: "e7", name: "Microfabrication",
      label: "Cleanroom · Photolithography · competent",
      type: "method", strength: 0.74, orbit_ring: 2,
      source: ["Lab", "Coursework"],
      detail: "George has done microfabrication in BU's photonics cleanroom: photolithography, parylene deposition, metal sputtering, wet etching. Competent but not expert — follows established protocols rather than designing new ones. Has a feel for yield issues and contamination problems. Uses it regularly but doesn't improvise."
    },
    {
      id: "e8", name: "Biocompatibility",
      label: "ISO 10993 · Cytotoxicity · coursework-level",
      type: "concept", strength: 0.66, orbit_ring: 2,
      source: ["Coursework"],
      detail: "ISO 10993 biocompatibility testing framework from BME 430 (Biomaterials). George understands cytotoxicity, sensitization, and systemic toxicity testing at a conceptual level but hasn't run biocompatibility assays himself. Relevant to his capstone glucose patch project. Knowledge is text-level, not hands-on."
    },
    {
      id: "e10", name: "LFP Analysis",
      label: "Oscillations · Power spectra · working",
      type: "method", strength: 0.71, orbit_ring: 2,
      source: ["Lab", "Literature"],
      detail: "Local field potential analysis: spectral power, oscillation frequency bands (theta, beta, gamma), coherence between channels. George generates spectrograms and PSD plots routinely. Comfortable with the math. Less comfortable with the neuroscience interpretation — what different bands mean biologically, and how to connect LFP features to behavior."
    },
    {
      id: "e11", name: "Hochberg 2012",
      label: "BrainGate · intracortical BCI · anchor paper",
      type: "paper", strength: 0.81, orbit_ring: 2,
      source: ["Literature"],
      detail: "Hochberg et al. 2012 (Nature) — seminal clinical demonstration of intracortical BCI enabling paralyzed patients to control robotic arms. George has read it thoroughly. It's his anchor paper for understanding the clinical potential of chronic neural recording. Can cite key results (cursor control, 2D/3D reach) and discuss the electrode longevity problem it revealed."
    },
    {
      id: "e12", name: "Polikov 2005",
      label: "FBR review · foundational · read twice",
      type: "paper", strength: 0.80, orbit_ring: 2,
      source: ["Literature"],
      detail: "Polikov, Tresco & Reichert (2005) — canonical review of the foreign body response to implanted neural electrodes. George has read it twice. His conceptual framework for the FBR cellular cascade comes primarily from this paper. Uses it as a reference when interpreting histology results from Prof. Shen's lab. Should read the 2016 update."
    },
    {
      id: "e18", name: "Kozai 2015",
      label: "Degradation study · 6-month · key evidence",
      type: "paper", strength: 0.62, orbit_ring: 2,
      source: ["Literature"],
      detail: "Kozai et al. (2015, Biomaterials) — detailed longitudinal study of recording quality degradation. Key finding: impedance changes and unit yield changes are temporally decoupled, suggesting separate biological vs. electrochemical processes. Directly relevant to George's central open question. Read once — should re-read before writing his thesis chapter."
    },
    {
      id: "e9", name: "Python / ML Stack",
      label: "Surface-level · uses not understands",
      type: "tool", strength: 0.52, orbit_ring: 2,
      source: ["Self-taught"],
      detail: "George uses Python (NumPy, Pandas, Matplotlib, scikit-learn) but his understanding is surface-level — he adapts existing scripts but struggles with non-obvious bugs. He's used PyTorch once for a class project but can't explain backpropagation or gradient descent clearly. This is the gap MIT and Stanford PhD committees will probe directly."
    },

    // ── Frontier / gaps (ring 3) ──────────────────────────────────────────────
    {
      id: "e14", name: "Deep Learning Decoding",
      label: "CNNs · RNNs · critical gap",
      type: "concept", strength: 0.31, orbit_ring: 3,
      source: ["Self-taught"],
      detail: "Using CNNs and RNNs to decode motor intent from neural population activity — the direction the field is moving fastest. George has read Pandarinath 2018 and Shenoy 2013 but can't implement anything. PhD committees at MIT and Stanford will ask about this. He knows the gap exists and hasn't closed it. Time-sensitive.",
      drifting: true
    },
    {
      id: "e15", name: "PEDOT:PSS",
      label: "Conducting polymer · impedance · gap",
      type: "concept", strength: 0.28, orbit_ring: 3,
      source: ["Lab"],
      detail: "Poly(3,4-ethylenedioxythiophene):polystyrene sulfonate — a conducting polymer coating that reduces electrode impedance by 2–3 orders of magnitude and improves charge injection capacity. Prof. Shen has referenced it in 2 consecutive lab meetings. George can't explain the electrochemistry behind it. It's becoming directly relevant to their electrode optimization work.",
      drifting: true
    },
    {
      id: "e16", name: "Spike Sorting Theory",
      label: "Kilosort · statistical gaps · black box",
      type: "method", strength: 0.45, orbit_ring: 3,
      source: ["Lab"],
      detail: "George uses Kilosort for spike sorting routinely but treats it as a black box. He understands PCA-based template matching at surface level but can't explain the Bayesian inference framework, drift correction algorithms, or when the assumptions break down. This is a weakness in his methods section — he uses it but can't defend it under questioning.",
      drifting: true
    },
    {
      id: "e17", name: "Degradation Hypothesis",
      label: "Mechanical displacement · original · untested",
      type: "concept", strength: 0.38, orbit_ring: 3,
      source: ["Lab", "Literature"],
      detail: "George's central original hypothesis: recording quality degrades due to mechanical displacement of neurons away from electrode tips (micro-motion, tissue remodeling) rather than electrode surface changes — which would explain stable impedance alongside dropping SNR. He has preliminary Week 8 data that's consistent. Hasn't formally tested it. This could be a thesis-level contribution.",
      drifting: false
    }
  ],
  patterns: [
    {
      id: "p1", from_entity: "e1", to_entity: "e4",
      label: "Array design → impedance characterization",
      confidence: 0.95, occurrences: "daily",
      action: "EIS runs on every electrode set before implant — well-established practice"
    },
    {
      id: "p2", from_entity: "e2", to_entity: "e6",
      label: "Chronic recording → glial response (central tension)",
      confidence: 0.99, occurrences: "core challenge",
      action: "The FBR is the primary obstacle to long-term recording stability"
    },
    {
      id: "p3", from_entity: "e3", to_entity: "e5",
      label: "Signal processing → MATLAB (primary implementation)",
      confidence: 0.95, occurrences: "daily",
      action: "All signal processing pipelines live in MATLAB"
    },
    {
      id: "p4", from_entity: "e9", to_entity: "e14",
      label: "Python gap → deep learning gap (compounding)",
      confidence: 0.88, occurrences: "blocking",
      action: "Closing the ML gap requires building Python proficiency first — they're linked"
    },
    {
      id: "p5", from_entity: "e7", to_entity: "e1",
      label: "Microfabrication → electrode construction",
      confidence: 0.92, occurrences: "per batch",
      action: "Arrays fabricated in cleanroom → characterized → implanted"
    },
    {
      id: "p6", from_entity: "e8", to_entity: "e6",
      label: "Biocompatibility testing → quantifies FBR severity",
      confidence: 0.87, occurrences: "per study",
      action: "Histology after explant measures the glial scar response"
    },
    {
      id: "p7", from_entity: "e15", to_entity: "e4",
      label: "PEDOT:PSS → reduces electrode impedance",
      confidence: 0.90, occurrences: "literature",
      action: "Filling this gap could improve lab electrode performance by ~40%"
    },
    {
      id: "p8", from_entity: "e17", to_entity: "e2",
      label: "Displacement hypothesis → explains SNR drop with stable impedance",
      confidence: 0.75, occurrences: "hypothesis",
      action: "Testing this formally is George's most original potential contribution"
    }
  ],
  profile_summary: {
    routines: [
      "Core strength: flexible electrode array design + chronic neural recording — 2 years lab depth",
      "Daily practice: MATLAB signal processing, EIS characterization, lab notebook documentation",
      "Literature base: 27+ papers read; Hochberg 2012 and Polikov 2005 as primary anchors",
      "Active data: Week 8 chronic recording study — SNR dropping, impedance stable"
    ],
    communication: [
      "Gap: deep learning / neural decoding — PhD committees at MIT & Stanford will probe this",
      "Gap: PEDOT:PSS electrochemistry — Prof. Shen mentioned twice, George can't speak to it",
      "Gap: Kilosort statistical foundations — uses it daily as a black box",
      "Opportunity: degradation hypothesis — original and partially supported by current data"
    ],
    relationships: [
      "Electrode design ↔ impedance spectroscopy — tightest conceptual link, daily practice",
      "Chronic recording ↔ glial response — the central unsolved tension in his field",
      "Python/ML ↔ deep learning decoding — the gap that compounds on itself",
      "PEDOT:PSS ↔ electrode optimization — Prof. Shen's current focus, George's emerging need"
    ],
    patterns: [
      "MATLAB high / Python-ML surface-level — asymmetry that will matter in interviews",
      "Deep literature base on recording stability, thin on biocompatibility and polymer coatings",
      "Degradation hypothesis: partially tested, original, high upside — needs formal experiment"
    ],
    decisions: [
      "Close deep learning gap now (PhD interviews) vs. stay focused on current experiment",
      "Whether to formally test displacement hypothesis as thesis contribution",
      "Learn PEDOT:PSS now (relevant to capstone) or wait until next semester"
    ]
  }
};
