// v58 (Nov 3 3:15pm): THE DOOR RULE (RULES v17.1, Sam 3:03-3:13pm; process/handoff-interval-jumps.md). v0.2 walkthrough = new chapter 1
// (Levels' solver/pipe/staging/ch1-doors/ch1-level-1..5; L5 = swap star test, Sam 5:04pm) + one shifter preview board (staging/jump/s1). Old warm-ups and ch2/ch3 hidden (Sam cut them for v0.2).
// Fields: startNote = the note you hold at the start; jump ['letter'] = a door takes your letter in any octave; 'E=X' = the end door; 'N' = shifter (up a fifth).
const LEVELS = [
{
"id": "c1",
"title": "Chapter 1, level 1: your note",
"chapter": 1,
"role": "intro",
"from": "Pherkad",
"to": "Thuban",
"src": "solver/pipe/staging/ch1-doors/ch1-level-1.json (Levels Nov 5 9:52pm: EASY EAR, wrong notes are A or F; chapter G3 G4 G5 G6 A5 F5 F6)",
"rows": [
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ E=G5 @ @ @"
],
"start": 3,
"reveal": [
9
],
"startNote": "G4",
"jump": [
"letter"
]
},
{
"id": "c2",
"title": "Chapter 1, level 2: turn to pick",
"chapter": 1,
"role": "drill 1",
"from": "Thuban",
"to": "Eltanin",
"src": "solver/pipe/staging/ch1-doors/ch1-level-2.json (Levels Nov 5 9:52pm: EASY EAR, wrong notes are A or F; chapter G3 G4 G5 G6 A5 F5 F6)",
"rows": [
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ # # # # # @",
"@ # @ @ @ # @",
"@ # @ @ @ # @",
"@ # @ @ @ # @",
"@ E=G6 @ @ @ E=A4 @"
],
"start": 3,
"reveal": [
9
],
"startNote": "G5",
"jump": [
"letter"
]
},
{
"id": "c3",
"title": "Chapter 1, level 3: your color changes",
"chapter": 1,
"role": "drill 2",
"from": "Eltanin",
"to": "Bellatrix",
"src": "solver/pipe/staging/ch1-doors/ch1-level-3.json (Levels Nov 5 9:52pm: EASY EAR, wrong notes are A or F; chapter G3 G4 G5 G6 A5 F5 F6)",
"rows": [
"@ @ @ # @ @ @",
"@ # # # # # @",
"@ F6 @ @ @ G5 @",
"@ # @ @ @ # @",
"@ # # # # # @",
"@ # @ # @ # @",
"@ # @ # @ # @",
"@ # @ # @ # @",
"@ E=G4 @ E=A5 @ E=F5 @"
],
"start": 3,
"reveal": [
9
],
"startNote": "G6",
"jump": [
"letter"
]
},
{
"id": "c4",
"title": "Chapter 1, level 4: look past the door, twice",
"chapter": 1,
"role": "drill 3",
"from": "Bellatrix",
"to": "Mintaka",
"src": "solver/pipe/staging/ch1-doors/ch1-level-4.json (Levels Nov 7: two forks, LOCKED as live L4 Nov 7 5:40pm ET, Sam 'agreed'; starts G4 ends G5; fork 1 low wins, fork 2 high wins; adds A3, the 9th chapter note)",
"rows": [
"@ @ @ # @ @ @",
"@ # # # # # @",
"@ G5 @ @ @ G3 @",
"@ # @ @ @ # @",
"@ # @ @ @ G4 @",
"@ # @ # # # @",
"@ # @ # @ G3 @",
"@ # @ # @ # @",
"@ E=A4 @ E=G5 @ E=A3 @"
],
"hue9": "A3",
"start": 3,
"reveal": [
9
],
"startNote": "G4",
"jump": [
"letter"
]
},
{
"id": "c5",
"title": "Chapter 1, level 5: the swap star (test)",
"chapter": 1,
"role": "test",
"from": "Mintaka",
"to": "Alnilam",
"src": "solver/pipe/staging/ch1-doors/ch1-level-5.json (Levels Nov 5 9:52pm: EASY EAR, wrong notes are A or F; chapter G3 G4 G5 G6 A5 F5 F6)",
"rows": [
"@ @ @ # @ @ @",
"@ @ @ # @ @ @",
"@ @ @ S=A5 @ @ @",
"@ # # # # # @",
"@ S=G4 @ @ @ S=F5 @",
"@ # @ @ @ # @",
"@ # @ @ @ # @",
"@ # @ @ @ # @",
"@ E=A5 @ @ @ E=F6 @"
],
"start": 3,
"reveal": [
9
],
"startNote": "G5",
"jump": [
"letter"
]
},
{
"id": "s1",
"title": "Shifter preview (ch2): the shifter",
"chapter": 2,
"role": "shifter preview (ch2)",
"from": "Alnilam",
"to": "Alnitak",
"src": "solver/pipe/staging/jump/s1.json (Levels, Nov 3 3:11pm; RULES v17.1)",
"rows": [
"@ @ @ # @ @ @",
"@ # # # # # @",
"@ G5 @ @ @ N @",
"@ # @ @ @ # @",
"@ # # E=D5 # # @"
],
"start": 3,
"reveal": [
5
],
"startNote": "G3",
"jump": [
"letter"
]
}
];
/* v72 (Sam Nov 5 9:56pm, audit 3 "Ch2's swirl ring is unreadable": "Cut this from 0.2"): the s1 shifter preview board is out of the v0.2 build, so chapter 1 ends after L5 straight into the end. The board stays here; ?s1=1 brings it back for dev. */
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('s1') !== '1') LEVELS.splice(LEVELS.findIndex(l => l.id === 's1'), 1);
if (typeof module !== 'undefined') module.exports = LEVELS;
