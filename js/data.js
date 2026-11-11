/**
 * ============================================================================
 * 1. AUTHENTIC SANSAD SHOWDOWN (FIGHTKARO.COM) ROSTER & MOVE DATA
 * ============================================================================
 */
const ROSTER = {
    MITRAMAN: {
        id: 'MITRAMAN', name: 'MITRAMAN', team: 'Team Vaada', hp: 100, dmgMult: 1.08, walkSpeed: 5.5,
        color: 0xff7700, outfitColor: 0xffffff, beard: true, hairColor: 0xeeeeee, icon: '🪷',
        introLine: 'Mitron! Bhaiyo aur behno!',
        superLine: 'Mitra Chakra!',
        sp1Name: 'DEMONETIZATION PALM', sp2Name: 'SURPRISE STRIKE', superName: 'MITRA CHAKRA',
        superDmg: 30
    },
    YATRABOY: {
        id: 'YATRABOY', name: 'YATRA BOY', team: 'Team Yatra', hp: 100, dmgMult: 1.00, walkSpeed: 6.3,
        color: 0x00b4ff, outfitColor: 0xffffff, beard: true, hairColor: 0x222222, icon: '🏃',
        introLine: 'Chalo, Yatra shuru! Mohabbat ki dukaan!',
        superLine: 'Idhar se Aloo dalo, udhar se Sona niklega!',
        sp1Name: 'ROADSHOW UPPERCUT', sp2Name: 'LAMBI YATRA KICK', superName: 'ALOO SE SONA',
        superDmg: 30
    },
    DEEDEE: {
        id: 'DEEDEE', name: 'DEEDEE', team: 'Team Dharna', hp: 100, dmgMult: 0.95, walkSpeed: 6.8,
        color: 0x00e676, outfitColor: 0xf4f8ff, beard: false, hairColor: 0x111111, icon: '🩴',
        introLine: 'Dharna hobe! Khela hobe!',
        superLine: 'Jadu Hobe! Hamba Hamba!',
        sp1Name: 'CHAPPAL SLAP', sp2Name: 'PADAYATRA KICK', superName: 'JADU HOBE',
        superDmg: 30
    },
    TARIFFTAAU: {
        id: 'TARIFFTAAU', name: 'TARIFF TAAU', team: 'Team Tariff', hp: 100, dmgMult: 1.10, walkSpeed: 5.0,
        color: 0xffcc00, outfitColor: 0x162244, RedTie: true, hairColor: 0xffd700, icon: '📦',
        introLine: 'Sab pe Tariff lagega! Tremendous!',
        superLine: 'Tariff Tsunami! Huge Deal!',
        sp1Name: 'EXECUTIVE ORDER', sp2Name: 'BADA DEAL KICK', superName: 'TARIFF TSUNAMI',
        superDmg: 30
    },
    DOZERDADA: {
        id: 'DOZERDADA', name: 'DOZER DADA', team: 'Team Dozer', hp: 100, dmgMult: 1.06, walkSpeed: 5.8,
        color: 0xff5500, outfitColor: 0xff6600, bald: true, hairColor: 0xff6600, icon: '🚜',
        introLine: 'Bulldozer taiyaar hai!',
        superLine: 'Dozer Ka Dhamaka!',
        sp1Name: 'BULLDOZER PUNCH', sp2Name: 'DEMOLITION KICK', superName: 'DOZER KA DHAMAKA',
        superDmg: 30
    },
    TOLLMAN: {
        id: 'TOLLMAN', name: 'TOLL MAN', team: 'Team Highway', hp: 100, dmgMult: 1.05, walkSpeed: 5.5,
        color: 0x33ccff, outfitColor: 0x334455, hairColor: 0x333333, icon: '🚧',
        introLine: 'Toll bharo, aage badho!',
        superLine: 'Gaddha Blast! Express Highway!',
        sp1Name: 'TOLL TAX UPPERCUT', sp2Name: 'FLYOVER KICK', superName: 'GADDHA BLAST',
        superDmg: 30
    },
    MBAPU: {
        id: 'MBAPU', name: 'BOSS MBAPU', team: 'Shanti Akhada · Boss', hp: 200, dmgMult: 1.15, walkSpeed: 5.4,
        color: 0xffe680, outfitColor: 0xffffff, bald: true, glasses: true, staff: true, icon: '🕊️',
        introLine: 'Ahimsa paramo dharma! Shanti rakho!',
        superLine: 'Manch Chhodo!',
        sp1Name: 'SATYAGRAHA PALM', sp2Name: 'DANDI MARCH KICK', superName: 'MANCH CHHODO',
        superDmg: 40
    }
};

// Authentic Combo Scaling Table from Sansad Showdown public build
const COMBO_SCALING = [1.00, 0.90, 0.78, 0.66, 0.54, 0.44, 0.35];

// Frame & Attack Definitions
const MOVES = {
    PUNCH_1: { dmg: 6,  range: 1.75, startup: 0.06, active: 0.08, recovery: 0.15, stun: 0.28, push: 1.4, low: false },
    PUNCH_2: { dmg: 7,  range: 1.85, startup: 0.07, active: 0.08, recovery: 0.17, stun: 0.30, push: 1.8, low: false },
    PUNCH_3: { dmg: 11, range: 2.05, startup: 0.09, active: 0.10, recovery: 0.26, stun: 0.42, push: 5.2, knockdown: true },
    KICK_1:  { dmg: 9,  range: 2.05, startup: 0.09, active: 0.10, recovery: 0.22, stun: 0.34, push: 2.5, low: false },
    KICK_2:  { dmg: 13, range: 2.25, startup: 0.12, active: 0.11, recovery: 0.30, stun: 0.45, push: 6.0, knockdown: true },
    SWEEP:   { dmg: 10, range: 2.15, startup: 0.10, active: 0.12, recovery: 0.32, stun: 0.45, push: 3.0, knockdown: true, low: true },
    GRAB:    { dmg: 14, range: 1.45, startup: 0.08, active: 0.10, recovery: 0.35, stun: 0.50, push: 6.5, knockdown: true, unblockable: true },
    SP_PUNCH:{ dmg: 15, range: 2.40, startup: 0.11, active: 0.14, recovery: 0.28, stun: 0.46, push: 6.8, knockdown: true },
    SP_KICK: { dmg: 17, range: 2.65, startup: 0.13, active: 0.15, recovery: 0.32, stun: 0.50, push: 7.5, knockdown: true }
};
