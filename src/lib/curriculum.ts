// Curriculum content — extracted programmatically from the original single-file CaMI app
// (all 109 exercises, checkers, lesson prose, glossary and chapter icons), then wired into ESM
// imports/exports. The content itself is verbatim: it was already tested exhaustively (starter
// fails / solution passes, for every exercise) in that form.
// @ts-nocheck
import AlgoEngine from "./algoEngine";
import type { Curriculum, GlossaryEntry } from "./types";

function oracleCheck(result, expectFn, opts){
  opts = opts || {};
  if(!result.success){
    return {pass:false, message: "Il y a une erreur dans le code" + (result.error.line?` (ligne ${result.error.line})`:"") + " : " + result.error.message};
  }
  let expected;
  try{ expected = expectFn(result.globals); }
  catch(e){ return {pass:false, message: opts.missingVarMsg || "Il manque une variable attendue — relis bien la consigne."}; }
  if(expected === undefined) return {pass:false, message: opts.missingVarMsg || "Il manque une variable attendue — relis bien la consigne."};
  const stringify = opts.fmt || String;
  const out = result.output;
  // by default an array means "one expected line per element" (multi-print exercises);
  // pass singleValue:true when the expected value itself is one list/dict to be printed as a single line.
  const isMultiLine = Array.isArray(expected) && !opts.singleValue;
  const expArr = isMultiLine ? expected.map(stringify) : [stringify(expected)];
  const tailOk = opts.fullMatch
    ? JSON.stringify(out) === JSON.stringify(expArr)
    : out.length>0 && JSON.stringify(out.slice(out.length-expArr.length)) === JSON.stringify(expArr);
  if(tailOk) return {pass:true, message: opts.okMsg || "Bravo, c'est exactement ça !"};
  return {pass:false, message: opts.failMsg ? opts.failMsg(expArr, out) : `Résultat attendu : ${expArr.join(" / ")} — vérifie ton calcul et tes AFFICHER.`};
}

function outputCheck(result, expectedLines, opts){
  opts = opts || {};
  if(!result.success){
    return {pass:false, message: "Il y a une erreur dans le code" + (result.error.line?` (ligne ${result.error.line})`:"") + " : " + result.error.message};
  }
  const tailOk = opts.fullMatch
    ? JSON.stringify(result.output) === JSON.stringify(expectedLines)
    : result.output.length>0 && JSON.stringify(result.output.slice(result.output.length-expectedLines.length)) === JSON.stringify(expectedLines);
  if(tailOk) return {pass:true, message: opts.okMsg || "Bravo, c'est exactement ça !"};
  return {pass:false, message: opts.failMsg ? opts.failMsg(expectedLines, result.output) : `Résultat attendu : ${expectedLines.join(" / ")}.`};
}

const GLOSSARY = [
  { id:"algorithme", term:"Algorithme", tag:"général",
    def:"Une suite d'instructions précises, écrites dans un ordre donné, pour résoudre un problème — un peu comme une recette de cuisine." },
  { id:"variable", term:"Variable", tag:"général",
    def:"Une boîte étiquetée dans laquelle on range une valeur (un nombre, du texte...) pour s'en resservir plus tard. On écrit <code>nom = valeur</code>.",
    example:{pseudo:`prenom = "Ada"\nAFFICHER(prenom)`, python:`prenom = "Ada"\nprint(prenom)`} },
  { id:"condition", term:"Condition (SI / if)", tag:"général",
    def:"Une instruction qui exécute un bloc de code seulement si un test est vrai — sinon elle passe à une autre branche (SINON / else).",
    example:{pseudo:`SI age >= 18 ALORS\n    AFFICHER("majeur")\nFINSI`, python:`if age >= 18:\n    print("majeur")`} },
  { id:"boucle", term:"Boucle (POUR / TANTQUE)", tag:"général",
    def:"Une instruction qui répète un bloc de code plusieurs fois — un nombre de fois connu (POUR / for) ou tant qu'une condition reste vraie (TANTQUE / while).",
    example:{pseudo:`POUR i DE 1 A 3\n    AFFICHER(i)\nFINPOUR`, python:`for i in range(1, 4):\n    print(i)`} },
  { id:"fonction", term:"Fonction", tag:"général",
    def:"Un petit bloc de code réutilisable, auquel on donne un nom et parfois des paramètres, et qui peut renvoyer un résultat avec RETOURNER / return.",
    example:{pseudo:`FONCTION double(n)\n    RETOURNER n * 2\nFINFONCTION`, python:`def double(n):\n    return n * 2`} },
  { id:"parametre", term:"Paramètre / argument", tag:"général",
    def:"Une valeur qu'on donne à une fonction quand on l'appelle, pour qu'elle puisse s'en servir dans son calcul (le <code>n</code> dans <code>double(n)</code>)." },
  { id:"retour", term:"Retour (return)", tag:"général",
    def:"Le résultat qu'une fonction renvoie à l'endroit où elle a été appelée, grâce à l'instruction RETOURNER / return." },
  { id:"operateur-comparaison", term:"Opérateur de comparaison", tag:"général",
    def:"Un symbole comme <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code> qui compare deux valeurs et renvoie VRAI/FAUX (True/False)." },
  { id:"operateur-logique", term:"Opérateur logique (ET / OU / NON)", tag:"général",
    def:"Permet de combiner plusieurs conditions : ET (and) exige que tout soit vrai, OU (or) qu'au moins une le soit, NON (not) inverse une condition." },
  { id:"iteration", term:"Itération", tag:"général",
    def:"Un seul passage dans une boucle. Une boucle qui tourne 5 fois fait 5 itérations." },
  { id:"interpreteur", term:"Interpréteur", tag:"général",
    def:"Le programme qui lit ton code ligne par ligne et l'exécute — c'est lui qui « comprend » Python ou le pseudocode et produit le résultat." },
  { id:"liste", term:"Liste (tableau)", tag:"python",
    def:"Une variable qui range plusieurs valeurs à la suite, chacune repérée par sa position (son indice), en commençant à 0.",
    example:{python:`courses = ["pates", "riz"]\nprint(courses[0])`} },
  { id:"indice", term:"Indice (index)", tag:"python",
    def:"La position d'un élément dans une liste ou une chaîne de caractères, en partant de 0 pour le premier élément (et -1 pour le dernier)." },
  { id:"chaine", term:"Chaîne de caractères (string)", tag:"python",
    def:"Un texte, toujours entouré de guillemets, comme <code>\"bonjour\"</code>. On peut la découper ou la transformer avec des méthodes comme <code>.upper()</code> ou <code>.split()</code>." },
  { id:"dictionnaire", term:"Dictionnaire", tag:"python",
    def:"Une variable qui range des valeurs associées chacune à une étiquette (une clé), plutôt qu'à une position — pratique pour retrouver une info par son nom.",
    example:{python:`prix = {"pates": 3}\nprint(prix["pates"])`} },
  { id:"erreur", term:"Erreur / exception", tag:"python",
    def:"Un problème qui arrête l'exécution du programme (par exemple diviser par zéro). Le bloc <code>try/except</code> permet de « attraper » cette erreur pour réagir sans planter le programme.",
    example:{python:`try:\n    x = int("abc")\nexcept:\n    print("erreur attrapee")`} },
  { id:"break-continue", term:"break / continue", tag:"python avancé",
    def:"Deux instructions pour piloter une boucle de l'intérieur : <code>break</code> l'arrête immédiatement, <code>continue</code> saute directement à l'itération suivante sans exécuter le reste du bloc.",
    example:{python:`for i in range(10):\n    if i == 3:\n        break\n    print(i)`} },
  { id:"comprehension", term:"Compréhension de liste", tag:"python avancé",
    def:"Une façon compacte de construire une liste en une seule ligne, en décrivant sa transformation : <code>[expression for element in iterable]</code>, avec un <code>if</code> optionnel pour filtrer.",
    example:{python:`carres = [x * x for x in range(5)]\nprint(carres)`} },
  { id:"recursivite", term:"Récursivité", tag:"python avancé",
    def:"Une fonction qui s'appelle elle-même pour résoudre un problème, en le ramenant à une version plus petite de lui-même, jusqu'à un « cas de base » qui arrête la répétition.",
    example:{python:`def factorielle(n):\n    if n <= 1:\n        return 1\n    return n * factorielle(n - 1)`} },
  { id:"classe-objet", term:"Classe / objet", tag:"python avancé",
    def:"Une <strong>classe</strong> est un plan de fabrication qui décrit des données (attributs) et des comportements (méthodes). Un <strong>objet</strong> (ou instance) est une réalisation concrète de ce plan, créée avec <code>NomDeClasse(...)</code>.",
    example:{python:`class Personnage:\n    def __init__(self, nom):\n        self.nom = nom\n\nh = Personnage("Aria")\nprint(h.nom)`} },
  { id:"args", term:"*args (arguments variables)", tag:"python avancé",
    def:"Une façon d'écrire une fonction qui accepte un nombre variable d'arguments : ils sont tous regroupés dans une liste à l'intérieur de la fonction.",
    example:{python:`def total(*nombres):\n    s = 0\n    for n in nombres:\n        s += n\n    return s\nprint(total(1, 2, 3))`} },
  { id:"intelligence-artificielle", term:"Intelligence artificielle (IA)", tag:"IA",
    def:"Un ensemble de techniques qui permettent à un programme de réaliser des tâches qui semblent demander de l'intelligence (reconnaître, prédire, décider) — souvent en s'appuyant sur des exemples plutôt que sur des règles écrites à la main." },
  { id:"apprentissage-supervise", term:"Apprentissage supervisé", tag:"IA",
    def:"Une méthode où l'on donne au programme des exemples déjà étiquetés (une entrée et la bonne réponse attendue), pour qu'il apprenne à prédire l'étiquette de nouveaux exemples jamais vus." },
  { id:"neurone-artificiel", term:"Neurone artificiel (perceptron)", tag:"IA",
    def:"Le modèle le plus simple d'unité d'apprentissage : il multiplie chaque entrée par un poids, additionne le tout avec un biais, puis décide d'une sortie. Il « apprend » en ajustant peu à peu ses poids selon ses erreurs." },
  { id:"regression", term:"Régression linéaire", tag:"IA",
    def:"Une méthode qui cherche la droite (ou la formule) qui approche au mieux un ensemble de points, pour ensuite prédire une valeur numérique à partir de nouvelles entrées." },
];

const MAP_ICONS = {
  "a-variables":"🧳", "a-conditions":"🍽️", "a-boucles":"💰", "a-fonctions":"🧰", "a-projet":"🧮",
  "p-variables":"✈️", "p-conditions":"🌦️", "p-boucles":"🍲", "p-fonctions":"🗂️",
  "p-listes":"📍", "p-chaines":"📝", "p-dictionnaires":"🗺️", "p-erreurs":"🛠️", "p-projet":"📔",
  "pa-boucles":"🔁", "pa-fonctions":"🎒", "pa-comprehensions":"⚡", "pa-recursivite":"🪆",
  "pa-poo":"🧩", "pa-fichiers":"🗄️", "pa-organiser":"🧱", "pa-projet":"🧭",
  "ia-intro":"🤖", "ia-chatbot":"💬", "ia-classification":"🔎", "ia-neurone":"🧠",
  "ia-regression":"📈", "ia-projet":"🚀",
};

const CURRICULUM = {
  algo: {
    id:"algo", label:"Partie 1", shortLabel:"Algo", langTag:"pseudocode",
    run: (src)=>AlgoEngine.runPseudo(src),
    chapters:[
      {
        id:"a-variables", title:"Variables & affichage",
        story:"CaMI sort sa calculette (mentale) : il faut chiffrer le voyage et caler le programme télé avant le grand départ. Direction les <b>variables</b> — la toute première brique pour qu'un programme retienne des informations.",
        teaser:"Prochaine étape : le repas d'équipe... et un choix de film qui va diviser tout le monde.",
        intro:[
          "Un <strong>algorithme</strong>, c'est simplement une suite d'instructions précises pour résoudre un problème — un peu comme une recette de cuisine : on suit les étapes, dans l'ordre, et on obtient un résultat.",
          "La toute première brique, c'est la <strong>variable</strong> : une boîte étiquetée dans laquelle on range une valeur (un nombre, du texte...) pour s'en resservir plus tard. On écrit <code>nom = valeur</code> pour créer ou modifier une variable.",
          "Pour afficher un résultat à l'écran, on utilise l'instruction <code>AFFICHER(...)</code>. On peut lui donner plusieurs éléments séparés par des virgules : ils seront affichés les uns après les autres."
        ],
        callout:"Les mots-clés du pseudocode s'écrivent en MAJUSCULES (SI, POUR, AFFICHER...) — ça les rend faciles à repérer dans le code, comme dans un vrai langage.",
        example:{code:
`prenom = "Ada"
age = 29
AFFICHER(prenom)
AFFICHER(age)
AFFICHER(age + 1)`},
        exercises:[
          {
            id:"a1-1", title:"Le budget du city-trip",
            instr:'Deux variables sont déjà créées : <code>prix_nuit</code> et <code>nb_nuits</code>. Calcule le montant total du séjour (prix_nuit × nb_nuits), range-le dans une variable <code>total</code>, puis affiche-la avec <code>AFFICHER</code>.',
            starter:
`prix_nuit = 89
nb_nuits = 4

# Calcule le total ici, puis affiche-le

`,
            hints:[
              "Le total, c'est prix_nuit multiplié par nb_nuits — utilise l'opérateur *.",
              'N\'oublie pas de ranger le résultat dans une variable (par exemple total = ...) avant de l\'afficher avec AFFICHER(total).'
            ],
            solution:`prix_nuit = 89\nnb_nuits = 4\ntotal = prix_nuit * nb_nuits\nAFFICHER(total)`,
            alternatives:[
              { label:"Sans variable intermédiaire", code:`prix_nuit = 89\nnb_nuits = 4\nAFFICHER(prix_nuit * nb_nuits)`,
                note:"Si le résultat ne sert qu'une fois, on peut l'afficher directement sans le ranger dans « total » — mais une variable nommée rend souvent le code plus lisible." }
            ],
            checker:(r)=>oracleCheck(r, (g)=> {
              const prix = g.prix_nuit, quantite = g.nb_nuits;
              if(typeof prix!=="number" || typeof quantite!=="number") throw 0;
              return Math.round(prix*quantite*1e10)/1e10;
            }, {failMsg:(exp,out)=>`Pour prix_nuit × nb_nuits, il fallait afficher ${exp[0]}. Vérifie ton calcul et que tu affiches bien "total".`})
          },
          {
            id:"a1-2", title:"Le marathon de la saison",
            instr:'Avec <code>minutes_episode</code> et <code>nb_episodes</code> déjà créées, affiche d\'abord leur somme (juste pour t\'entraîner à l\'addition), puis leur produit — qui donne le temps total si tu regardes toute la saison d\'affilée.',
            starter:
`minutes_episode = 42
nb_episodes = 10

# Affiche minutes_episode + nb_episodes, puis minutes_episode * nb_episodes


`,
            hints:[
              "Deux AFFICHER : le premier avec +, le second avec *.",
              'AFFICHER(minutes_episode + nb_episodes) puis, en dessous, AFFICHER(minutes_episode * nb_episodes).'
            ],
            solution:`minutes_episode = 42\nnb_episodes = 10\nAFFICHER(minutes_episode + nb_episodes)\nAFFICHER(minutes_episode * nb_episodes)`,
            alternatives:[
              { label:"Avec des variables nommées", code:`minutes_episode = 42\nnb_episodes = 10\nsomme = minutes_episode + nb_episodes\nproduit = minutes_episode * nb_episodes\nAFFICHER(somme)\nAFFICHER(produit)`,
                note:"Nommer les résultats intermédiaires (somme, produit) aide à s'y retrouver quand les calculs se complexifient." }
            ],
            checker:(r)=>oracleCheck(r, (g)=>{
              if(typeof g.minutes_episode!=="number"||typeof g.nb_episodes!=="number") throw 0;
              return [g.minutes_episode+g.nb_episodes, g.minutes_episode*g.nb_episodes];
            }, {fullMatch:true, failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]} (dans cet ordre).`})
          }
        ]
      },
      {
        id:"a-conditions", title:"Conditions",
        story:"Ce soir, repas d'équipe avant le grand départ, et petit débat sur le film à lancer juste après. CaMI a besoin d'un programme capable de choisir selon la situation — bienvenue dans les <b>conditions</b>.",
        teaser:"Ensuite : les économies s'accumulent, jour après jour — il va falloir tout recompter.",
        intro:[
          "Une <strong>condition</strong> permet de faire des choix dans un programme : « si telle chose est vraie, fais ceci ; sinon, fais autre chose ».",
          "La structure est : <code>SI condition ALORS ... SINON ... FIN SI</code>. On peut enchaîner plusieurs cas avec <code>SINON SI</code>.",
          "Les comparateurs disponibles sont <code>==</code> (égal à), <code>!=</code> (différent de), <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>. On peut combiner des conditions avec <code>ET</code>, <code>OU</code> et <code>NON</code>."
        ],
        callout:"Attention : <code>=</code> sert à affecter une valeur, alors que <code>==</code> sert à comparer deux valeurs. C'est une confusion très fréquente au début !",
        example:{code:
`temperature = 28
SI temperature >= 30 ALORS
    AFFICHER("Il fait tres chaud")
SINONSI temperature >= 20 ALORS
    AFFICHER("Il fait bon")
SINON
    AFFICHER("Il fait froid")
FINSI`},
        exercises:[
          {
            id:"a2-1", title:"Partager la recette",
            instr:'La variable <code>parts</code> (le nombre de parts d\'une recette) est déjà définie. Affiche <code>"pair"</code> si on peut la partager en deux portions égales, sinon <code>"impair"</code>. Astuce : <code>parts % 2</code> donne le reste de la division par 2.',
            starter:
`parts = 6

SI  ALORS

FINSI
`,
            hints:[
              "Une condition avec % : le reste de la division par 2 s'écrit parts % 2.",
              'SI parts % 2 == 0 ALORS AFFICHER("pair") SINON AFFICHER("impair") FIN SI'
            ],
            solution:`parts = 6\nSI parts % 2 == 0 ALORS\n    AFFICHER("pair")\nSINON\n    AFFICHER("impair")\nFINSI`,
            alternatives:[
              { label:"En testant l'inverse", code:`parts = 6\nSI parts % 2 != 0 ALORS\n    AFFICHER("impair")\nSINON\n    AFFICHER("pair")\nFINSI`,
                note:"On peut tester la condition inverse (!= au lieu de ==) en inversant les deux branches — le résultat final est identique." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{ if(typeof g.parts!=="number") throw 0; return g.parts%2===0?"pair":"impair"; },
              {failMsg:(exp)=>`Pour ce nombre de parts, il fallait afficher « ${exp[0]} ».`})
          },
          {
            id:"a2-2", title:"Ta note du film",
            instr:'La variable <code>note</code> est la note que tu donnes à un film (sur 20). Affiche <code>"chef-doeuvre"</code> si note ≥ 16, <code>"tres bon"</code> si note ≥ 14, <code>"correct"</code> si note ≥ 10, sinon <code>"a eviter"</code>.',
            starter:
`note = 12

SI  ALORS

FINSI
`,
            hints:[
              "Il faut enchaîner plusieurs cas : SI ... ALORS ... SINON SI ... ALORS ... SINON ... FIN SI.",
              'Commence par le seuil le plus haut : SI note >= 16 ALORS AFFICHER("chef-doeuvre") SINONSI note >= 14 ALORS ...'
            ],
            solution:`note = 12\nSI note >= 16 ALORS\n    AFFICHER("chef-doeuvre")\nSINONSI note >= 14 ALORS\n    AFFICHER("tres bon")\nSINONSI note >= 10 ALORS\n    AFFICHER("correct")\nSINON\n    AFFICHER("a eviter")\nFINSI`,
            alternatives:[
              { label:"En partant du bas", code:`note = 12\nSI note < 10 ALORS\n    AFFICHER("a eviter")\nSINONSI note < 14 ALORS\n    AFFICHER("correct")\nSINONSI note < 16 ALORS\n    AFFICHER("tres bon")\nSINON\n    AFFICHER("chef-doeuvre")\nFINSI`,
                note:"On peut enchaîner les seuils du plus bas vers le plus haut au lieu du plus haut vers le plus bas — les deux fonctionnent, tant que l'ordre des comparaisons reste cohérent." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.note!=="number") throw 0;
              const n=g.note;
              return n>=16?"chef-doeuvre": n>=14?"tres bon": n>=10?"correct":"a eviter";
            }, {failMsg:(exp)=>`Pour cette note, il fallait afficher « ${exp[0]} ».`})
          }
        ]
      },
      {
        id:"a-boucles", title:"Boucles",
        story:"Les économies s'accumulent jour après jour, et la recette du dîner doit être multipliée pour nourrir toute la bande. Plutôt que tout recalculer à la main, CaMI apprend à répéter des instructions automatiquement : les <b>boucles</b>.",
        teaser:"À suivre : CaMI veut ranger son code dans des outils réutilisables, avant le grand saut.",
        intro:[
          "Une <strong>boucle</strong> répète une série d'instructions, sans avoir à les recopier à la main.",
          "<code>POUR i DE a A b</code> répète le bloc pour chaque valeur de <code>i</code>, de <code>a</code> jusqu'à <code>b</code> inclus. Pratique quand on connaît le nombre de répétitions à l'avance.",
          "<code>TANT QUE condition</code> répète le bloc tant que la condition reste vraie. Pratique quand on ne sait pas à l'avance combien de fois il faudra répéter."
        ],
        callout:"Piège classique avec TANT QUE : si la condition ne devient jamais fausse, la boucle tourne indéfiniment. Pense toujours à faire évoluer une variable à l'intérieur de la boucle !",
        example:{code:
`total = 0
POUR i DE 1 A 5
    total = total + i
FINPOUR
AFFICHER(total)`},
        exercises:[
          {
            id:"a3-1", title:"Le défi économies voyage",
            instr:'Pour financer ton prochain voyage, tu fais le défi économies : jour 1 tu mets 1€ de côté, jour 2 tu mets 2€, jour 3 tu mets 3€... jusqu\'au jour <code>n</code>. En utilisant une boucle <code>POUR</code>, calcule combien tu auras économisé en tout après <code>n</code> jours, range le résultat dans <code>total</code>, puis affiche-le.',
            starter:
`n = 10
total = 0

POUR i DE 1 A n

FINPOUR

AFFICHER(total)
`,
            hints:[
              "À chaque tour de boucle, ajoute i (le montant du jour) à total : total = total + i.",
              "POUR i DE 1 A n\n    total = total + i\nFIN POUR — vérifie que total commence bien à 0 avant la boucle."
            ],
            solution:`n = 10\ntotal = 0\nPOUR i DE 1 A n\n    total = total + i\nFINPOUR\nAFFICHER(total)`,
            alternatives:[
              { label:"Avec TANT QUE", code:`n = 10\ntotal = 0\ni = 1\nTANTQUE i <= n\n    total = total + i\n    i = i + 1\nFINTANTQUE\nAFFICHER(total)`,
                note:"Une boucle TANT QUE fait exactement la même chose ici, à condition de gérer soi-même le compteur i (le créer, l'incrémenter)." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.n!=="number") throw 0;
              let s=0; for(let i=1;i<=g.n;i++) s+=i; return s;
            }, {failMsg:(exp)=>`Le total économisé attendu était ${exp[0]}. Vérifie que "total" part bien de 0 et s'incrémente à chaque tour.`})
          },
          {
            id:"a3-2", title:"Adapter la recette",
            instr:'La variable <code>n</code> représente les grammes de riz nécessaires pour 1 personne. Affiche, pour 1 à 10 convives, la quantité nécessaire, au format exact : <code>n x i = résultat</code> (par exemple <code>70 x 3 = 210</code>). Utilise <code>str(...)</code> pour transformer un nombre en texte avant de le coller avec +.',
            starter:
`n = 70

POUR i DE 1 A 10

FINPOUR
`,
            hints:[
              "Une boucle POUR i DE 1 A 10, et à l'intérieur un seul AFFICHER qui construit la ligne avec des +.",
              'AFFICHER(str(n) + " x " + str(i) + " = " + str(n*i))'
            ],
            solution:`n = 70\nPOUR i DE 1 A 10\n    AFFICHER(str(n) + " x " + str(i) + " = " + str(n*i))\nFINPOUR`,
            alternatives:[
              { label:"Avec TANT QUE", code:`n = 70\ni = 1\nTANTQUE i <= 10\n    AFFICHER(str(n) + " x " + str(i) + " = " + str(n*i))\n    i = i + 1\nFINTANTQUE`,
                note:"Même résultat avec TANT QUE, en gérant soi-même le compteur i au lieu de laisser POUR le faire." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.n!=="number") throw 0;
              const lines=[]; for(let i=1;i<=10;i++) lines.push(`${g.n} x ${i} = ${g.n*i}`);
              return lines;
            }, {fullMatch:true, failMsg:()=>`Format attendu pour chaque ligne : "n x i = résultat", par exemple "70 x 3 = 210".`})
          }
        ]
      },
      {
        id:"a-fonctions", title:"Fonctions",
        story:"Derniers réglages avant le grand saut : CaMI veut des petits outils réutilisables, pour ne plus jamais refaire deux fois le même calcul. Bienvenue dans le monde des <b>fonctions</b>.",
        teaser:"Prochaine étape : un dernier défi pour rassembler tout ce que tu as appris, avant de boucler les valises.",
        intro:[
          "Une <strong>fonction</strong> est un petit programme réutilisable : on lui donne des <em>paramètres</em> en entrée, elle effectue un calcul, et elle <code>RETOURNE</code> un résultat.",
          "Ça évite de recopier le même bloc de code partout, et ça permet de découper un gros problème en petits morceaux faciles à comprendre.",
          "Structure : <code>FONCTION nom(parametres) ... RETOURNER expression FIN FONCTION</code>. On l'appelle ensuite avec <code>nom(valeur)</code>, comme <code>AFFICHER(...)</code>."
        ],
        callout:"Une fonction peut s'appeler elle-même : ça s'appelle la <em>récursivité</em>. On la verra plus loin — pour l'instant, une fonction simple suffit amplement.",
        example:{code:
`FONCTION carre(n)
    RETOURNER n * n
FINFONCTION

AFFICHER(carre(6))`},
        exercises:[
          {
            id:"a4-1", title:"Fonction double portion",
            instr:'Quand tu invites deux fois plus de monde, il faut doubler les quantités de la recette. Écris une fonction <code>double(quantite)</code> qui retourne le double de <code>quantite</code>. Le code sera testé automatiquement avec plusieurs valeurs — pas besoin d\'appeler la fonction toi-même.',
            starter:
`FONCTION double(quantite)

FINFONCTION
`,
            hints:[
              "Une seule ligne suffit à l'intérieur : RETOURNER quantite * 2.",
              "FONCTION double(quantite)\n    RETOURNER quantite * 2\nFIN FONCTION"
            ],
            solution:`FONCTION double(quantite)\n    RETOURNER quantite * 2\nFINFONCTION`,
            alternatives:[
              { label:"Avec une addition", code:`FONCTION double(quantite)\n    RETOURNER quantite + quantite\nFINFONCTION`,
                note:"quantite + quantite donne exactement le même résultat que quantite * 2 — deux écritures valables pour « doubler »." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + "\nAFFICHER(double(100))\nAFFICHER(double(250))\nAFFICHER(double(0))\n";
              const res = AlgoEngine.runPseudo(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["200","500","0"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, ta fonction double() fonctionne pour tous les cas testés !"};
              return {pass:false, message:`Testée sur double(100), double(250), double(0), la fonction devait renvoyer ${expected.join(", ")}.`};
            }
          },
          {
            id:"a4-2", title:"Repérer les épisodes bonus",
            instr:'Dans une série, on considère souvent que les épisodes bonus sont ceux dont le numéro est pair. Écris une fonction <code>est_pair(n)</code> qui retourne <code>VRAI</code> si <code>n</code> est pair, <code>FAUX</code> sinon. Elle sera testée automatiquement avec plusieurs numéros d\'épisode.',
            starter:
`FONCTION est_pair(n)

FINFONCTION
`,
            hints:[
              "RETOURNER peut renvoyer directement une expression qui vaut VRAI ou FAUX : n % 2 == 0 en est déjà une.",
              "FONCTION est_pair(n)\n    RETOURNER n % 2 == 0\nFIN FONCTION"
            ],
            solution:`FONCTION est_pair(n)\n    RETOURNER n % 2 == 0\nFINFONCTION`,
            alternatives:[
              { label:"Avec un SI explicite", code:`FONCTION est_pair(n)\n    SI n % 2 == 0 ALORS\n        RETOURNER VRAI\n    SINON\n        RETOURNER FAUX\n    FINSI\nFINFONCTION`,
                note:"Plus long, mais parfois plus clair au début : on peut toujours détailler avec SI / SINON avant de retourner directement une condition." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + `
SI est_pair(4) ALORS
    AFFICHER("A")
SINON
    AFFICHER("B")
FINSI
SI est_pair(7) ALORS
    AFFICHER("A")
SINON
    AFFICHER("B")
FINSI
`;
              const res = AlgoEngine.runPseudo(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["A","B"];
              const tail=res.output.slice(res.output.length-2);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Exactement ça — est_pair() distingue bien pair et impair !"};
              return {pass:false, message:"Teste avec 4 (pair) et 7 (impair) : ta fonction ne retourne pas le bon résultat dans les deux cas."};
            }
          }
        ]
      },
      {
        id:"a-projet", title:"Projet : le budget du voyage",
        story:"Dernier arrêt avant l'aéroport : CaMI veut boucler le budget du voyage une bonne fois pour toutes. Un vrai petit projet t'attend, pour rassembler variables, conditions, boucles et fonctions dans un seul programme.",
        teaser:"Prochaine étape : les valises sont prêtes, direction l'aéroport — et un vrai langage de programmation.",
        intro:[
          "Ce chapitre n'introduit aucune nouvelle notion : c'est l'occasion de combiner tout ce que tu as appris jusqu'ici — <strong>variables</strong>, <strong>conditions</strong>, <strong>boucles</strong> et <strong>fonctions</strong> — dans un seul petit projet, comme dans un vrai programme.",
          "Chaque étape s'appuie sur les précédentes. Si tu bloques, c'est normal : relis le chapitre correspondant à la notion utilisée, rien de nouveau n'est demandé ici."
        ],
        callout:"Un projet, c'est juste plusieurs briques que tu connais déjà, assemblées ensemble. Prends ton temps sur chaque étape.",
        example:{code:
`budget_max = 500
vol = 220
hotel = 180
total = vol + hotel
SI total > budget_max ALORS
    AFFICHER("depassement")
SINON
    AFFICHER("budget ok")
FINSI`},
        exercises:[
          {
            id:"aproj-1", title:"Étape 1 — Additionner les dépenses",
            instr:'Trois dépenses du voyage sont déjà définies : <code>vol</code>, <code>hotel</code> et <code>activites</code>. Calcule leur somme dans une variable <code>total</code>, puis affiche-la.',
            starter:
`vol = 220
hotel = 180
activites = 90

`,
            hints:[
              "Additionne les trois variables avec + et range le résultat dans total.",
              "total = vol + hotel + activites\nAFFICHER(total)"
            ],
            solution:`vol = 220\nhotel = 180\nactivites = 90\ntotal = vol + hotel + activites\nAFFICHER(total)`,
            alternatives:[
              { label:"Sans variable intermédiaire", code:`vol = 220\nhotel = 180\nactivites = 90\nAFFICHER(vol + hotel + activites)`,
                note:"On peut afficher directement la somme sans passer par une variable total — mais la nommer aidera pour la suite du projet." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.vol!=="number"||typeof g.hotel!=="number"||typeof g.activites!=="number") throw 0;
              return g.vol+g.hotel+g.activites;
            }, {failMsg:(exp)=>`La somme de vol, hotel et activites devait afficher ${exp[0]}. Vérifie que "total" additionne bien les trois.`})
          },
          {
            id:"aproj-2", title:"Étape 2 — Respecter le budget",
            instr:'Cette fois, <code>total</code> et <code>budget_max</code> sont déjà définis. Affiche <code>"depassement"</code> si <code>total</code> dépasse <code>budget_max</code>, sinon affiche <code>"budget ok"</code>.',
            starter:
`total = 540
budget_max = 500

SI  ALORS

FINSI
`,
            hints:[
              "La condition compare directement les deux variables : total > budget_max.",
              'SI total > budget_max ALORS\n    AFFICHER("depassement")\nSINON\n    AFFICHER("budget ok")\nFINSI'
            ],
            solution:`total = 540\nbudget_max = 500\nSI total > budget_max ALORS\n    AFFICHER("depassement")\nSINON\n    AFFICHER("budget ok")\nFINSI`,
            alternatives:[
              { label:"Avec la condition inversée", code:`total = 540\nbudget_max = 500\nSI total <= budget_max ALORS\n    AFFICHER("budget ok")\nSINON\n    AFFICHER("depassement")\nFINSI`,
                note:"Tester le cas inverse (<= au lieu de >) en échangeant les deux branches donne exactement le même résultat." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.total!=="number"||typeof g.budget_max!=="number") throw 0;
              return g.total>g.budget_max?"depassement":"budget ok";
            }, {failMsg:(exp)=>`Avec ces valeurs, il fallait afficher « ${exp[0]} ».`})
          },
          {
            id:"aproj-3", title:"Étape 3 — Le budget repas jour après jour",
            instr:'Le voyage dure <code>jours</code> jours, et le budget repas augmente un peu chaque jour (les restaurants prévus en fin de séjour coûtent plus cher) : le jour <code>i</code> coûte exactement <code>20 + i</code> euros. Avec une boucle <code>POUR</code>, calcule le total dépensé en repas sur tout le séjour dans <code>total_repas</code> (déjà initialisée à 0).',
            starter:
`jours = 6
total_repas = 0

POUR i DE 1 A jours

FINPOUR

AFFICHER(total_repas)
`,
            hints:[
              "À chaque tour, ajoute le coût du jour i à total_repas : total_repas = total_repas + (20 + i).",
              "POUR i DE 1 A jours\n    total_repas = total_repas + (20 + i)\nFINPOUR"
            ],
            solution:`jours = 6\ntotal_repas = 0\nPOUR i DE 1 A jours\n    total_repas = total_repas + (20 + i)\nFINPOUR\nAFFICHER(total_repas)`,
            alternatives:[
              { label:"Avec TANT QUE", code:`jours = 6\ntotal_repas = 0\ni = 1\nTANTQUE i <= jours\n    total_repas = total_repas + (20 + i)\n    i = i + 1\nFINTANTQUE\nAFFICHER(total_repas)`,
                note:"Une boucle TANT QUE fait exactement la même chose ici, à condition de gérer soi-même le compteur i." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.jours!=="number") throw 0;
              let s=0; for(let i=1;i<=g.jours;i++) s+=20+i; return s;
            }, {failMsg:(exp)=>`Le total repas attendu était ${exp[0]}. Vérifie la formule (20 + i) et que total_repas part bien de 0.`})
          },
          {
            id:"aproj-4", title:"Étape 4 — Une fonction pour les bons plans",
            instr:'Pour finir, écris une fonction <code>reduction(prix, pourcentage)</code> qui retourne le prix après une réduction de <code>pourcentage</code> %. Par exemple, <code>reduction(100, 10)</code> doit retourner 90. Le code sera testé automatiquement avec plusieurs valeurs.',
            starter:
`FONCTION reduction(prix, pourcentage)

FINFONCTION
`,
            hints:[
              "Le montant de la réduction est prix * pourcentage / 100 ; il faut le soustraire à prix.",
              "FONCTION reduction(prix, pourcentage)\n    RETOURNER prix - (prix * pourcentage / 100)\nFIN FONCTION"
            ],
            solution:`FONCTION reduction(prix, pourcentage)\n    RETOURNER prix - (prix * pourcentage / 100)\nFINFONCTION`,
            alternatives:[
              { label:"Avec une variable intermédiaire", code:`FONCTION reduction(prix, pourcentage)\n    remise = prix * pourcentage / 100\n    RETOURNER prix - remise\nFINFONCTION`,
                note:"Calculer d'abord le montant de la remise dans une variable peut rendre le calcul plus lisible avant de le soustraire." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + "\nAFFICHER(reduction(100, 10))\nAFFICHER(reduction(200, 25))\nAFFICHER(reduction(50, 0))\n";
              const res = AlgoEngine.runPseudo(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["90","150","50"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, le budget du voyage est bouclé — direction l'aéroport !"};
              return {pass:false, message:`Testée sur reduction(100, 10), reduction(200, 25), reduction(50, 0), la fonction devait renvoyer ${expected.join(", ")}.`};
            }
          }
        ]
      }
    ]
  },
  python:{
    id:"python", label:"Partie 2", shortLabel:"Python", langTag:"python",
    run:(src)=>AlgoEngine.runPython(src),
    chapters:[
      {
        id:"p-variables", title:"Variables & affichage",
        story:"Embarquement ! Cette fois, CaMI code avec un vrai langage : <b>Python</b>. Même logique que dans la partie Algo, nouvelle syntaxe — les valises sont prêtes, direction l'aéroport.",
        teaser:"Ensuite : l'arrivée à destination, et un choix à faire selon la météo du jour.",
        intro:[
          "Bonne nouvelle : tu connais déjà toute la logique ! Il ne reste plus qu'à apprendre la <strong>syntaxe de Python</strong>, le langage le plus utilisé pour débuter.",
          "Une variable se crée exactement pareil : <code>nom = valeur</code>. Pour afficher quelque chose, on utilise <code>print(...)</code> — l'équivalent exact du <code>AFFICHER</code> du pseudocode.",
          "Grosse différence à connaître : en Python, les blocs de code (dans un <code>if</code>, une boucle, une fonction...) ne se terminent pas par un mot-clé « FIN » — ils sont délimités par l'<strong>indentation</strong> (les espaces en début de ligne). C'est essentiel : une indentation incorrecte provoque une erreur."
        ],
        callout:"En Python, les mots-clés s'écrivent en minuscules (if, for, def...) — contrairement au pseudocode. Et chaque bloc indenté doit utiliser le même nombre d'espaces (on prendra 4 espaces, c'est la convention).",
        example:{code:
`prenom = "Ada"
age = 29
print(prenom)
print(age)
print(age + 1)`},
        exercises:[
          {
            id:"p1-1", title:"Le budget du city-trip",
            instr:'Deux variables sont déjà créées : <code>prix_nuit</code> et <code>nb_nuits</code>. Calcule le montant total du séjour, range-le dans une variable <code>total</code>, puis affiche-la avec <code>print</code>.',
            starter:
`prix_nuit = 89
nb_nuits = 4

# Calcule le total ici, puis affiche-le
`,
            hints:[
              "Le total, c'est prix_nuit multiplié par nb_nuits — utilise l'opérateur *.",
              "N'oublie pas de ranger le résultat dans une variable (par exemple total = ...) avant de l'afficher avec print(total)."
            ],
            solution:`prix_nuit = 89\nnb_nuits = 4\ntotal = prix_nuit * nb_nuits\nprint(total)`,
            alternatives:[
              { label:"Sans variable intermédiaire", code:`prix_nuit = 89\nnb_nuits = 4\nprint(prix_nuit * nb_nuits)`,
                note:"Si le résultat ne sert qu'une fois, on peut l'afficher directement — mais une variable nommée rend souvent le code plus lisible." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              const prix=g.prix_nuit, quantite=g.nb_nuits;
              if(typeof prix!=="number"||typeof quantite!=="number") throw 0;
              return Math.round(prix*quantite*1e10)/1e10;
            }, {failMsg:(exp)=>`Pour prix_nuit × nb_nuits, il fallait afficher ${exp[0]}. Vérifie ton calcul et que tu affiches bien "total".`})
          },
          {
            id:"p1-2", title:"Le marathon de la saison",
            instr:'Avec <code>minutes_episode</code> et <code>nb_episodes</code>, affiche d\'abord leur somme (pour t\'entraîner à l\'addition), puis leur produit sur la ligne suivante — qui donne le temps total si tu regardes toute la saison d\'affilée.',
            starter:
`minutes_episode = 42
nb_episodes = 10

# Affiche minutes_episode + nb_episodes, puis minutes_episode * nb_episodes
`,
            hints:[
              "Deux print : le premier avec +, le second avec *.",
              "print(minutes_episode + nb_episodes) puis, en dessous, print(minutes_episode * nb_episodes)."
            ],
            solution:`minutes_episode = 42\nnb_episodes = 10\nprint(minutes_episode + nb_episodes)\nprint(minutes_episode * nb_episodes)`,
            alternatives:[
              { label:"Avec des variables nommées", code:`minutes_episode = 42\nnb_episodes = 10\nsomme = minutes_episode + nb_episodes\nproduit = minutes_episode * nb_episodes\nprint(somme)\nprint(produit)`,
                note:"Nommer les résultats intermédiaires (somme, produit) aide à s'y retrouver quand les calculs se complexifient." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.minutes_episode!=="number"||typeof g.nb_episodes!=="number") throw 0;
              return [g.minutes_episode+g.nb_episodes, g.minutes_episode*g.nb_episodes];
            }, {fullMatch:true, failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]} (dans cet ordre).`})
          }
        ]
      },
      {
        id:"p-conditions", title:"Conditions",
        story:"Arrivés à destination, il faut décider quoi faire selon la météo, et se souvenir de la note laissée aux films vus pendant le vol. Les mêmes <b>conditions</b> qu'avant, version Python.",
        teaser:"À suivre : le voyage avance, et certains calculs vont devoir se répéter plusieurs fois.",
        intro:[
          "Même logique qu'en pseudocode, syntaxe Python : <code>if condition:</code> puis le bloc indenté, <code>elif autre_condition:</code> pour les cas suivants, <code>else:</code> pour le reste.",
          "Les comparateurs et opérateurs logiques changent de nom : <code>and</code>, <code>or</code>, <code>not</code> remplacent ET / OU / NON. Les symboles <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code> restent identiques.",
          "N'oublie jamais les deux-points <code>:</code> à la fin de la ligne <code>if</code>/<code>elif</code>/<code>else</code>, et l'indentation du bloc qui suit."
        ],
        callout:"Erreur très fréquente en Python : oublier le <code>:</code> après la condition, ou mal indenter le bloc juste en dessous.",
        example:{code:
`temperature = 28
if temperature >= 30:
    print("Il fait tres chaud")
elif temperature >= 20:
    print("Il fait bon")
else:
    print("Il fait froid")`},
        exercises:[
          {
            id:"p2-1", title:"Partager la recette",
            instr:'La variable <code>parts</code> (le nombre de parts d\'une recette) est déjà définie. Affiche <code>"pair"</code> si on peut la partager en deux portions égales, sinon <code>"impair"</code>. Astuce : <code>parts % 2</code>.',
            starter:
`parts = 6

if :


`,
            hints:[
              "Une condition avec % : le reste de la division par 2 s'écrit parts % 2.",
              'if parts % 2 == 0:\n    print("pair")\nelse:\n    print("impair")'
            ],
            solution:`parts = 6\nif parts % 2 == 0:\n    print("pair")\nelse:\n    print("impair")`,
            alternatives:[
              { label:"En testant l'inverse", code:`parts = 6\nif parts % 2 != 0:\n    print("impair")\nelse:\n    print("pair")`,
                note:"On peut tester la condition inverse (!= au lieu de ==) en inversant les deux branches — le résultat final est identique." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{ if(typeof g.parts!=="number") throw 0; return g.parts%2===0?"pair":"impair"; },
              {failMsg:(exp)=>`Pour ce nombre de parts, il fallait afficher « ${exp[0]} ».`})
          },
          {
            id:"p2-2", title:"Ta note du film",
            instr:'La variable <code>note</code> est la note que tu donnes à un film (sur 20). Affiche <code>"chef-doeuvre"</code> si note ≥ 16, <code>"tres bon"</code> si note ≥ 14, <code>"correct"</code> si note ≥ 10, sinon <code>"a eviter"</code>.',
            starter:
`note = 12

if :


`,
            hints:[
              "Il faut enchaîner plusieurs cas : if ... : / elif ... : / elif ... : / else : .",
              'Commence par le seuil le plus haut : if note >= 16: print("chef-doeuvre") elif note >= 14: ...'
            ],
            solution:`note = 12\nif note >= 16:\n    print("chef-doeuvre")\nelif note >= 14:\n    print("tres bon")\nelif note >= 10:\n    print("correct")\nelse:\n    print("a eviter")`,
            alternatives:[
              { label:"En partant du bas", code:`note = 12\nif note < 10:\n    print("a eviter")\nelif note < 14:\n    print("correct")\nelif note < 16:\n    print("tres bon")\nelse:\n    print("chef-doeuvre")`,
                note:"On peut enchaîner les seuils du plus bas vers le plus haut au lieu du plus haut vers le plus bas — les deux fonctionnent, tant que l'ordre reste cohérent." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.note!=="number") throw 0;
              const n=g.note;
              return n>=16?"chef-doeuvre": n>=14?"tres bon": n>=10?"correct":"a eviter";
            }, {failMsg:(exp)=>`Pour cette note, il fallait afficher « ${exp[0]} ».`})
          }
        ]
      },
      {
        id:"p-boucles", title:"Boucles",
        story:"Le voyage avance, les économies ont porté leurs fruits, et il reste des recettes locales à adapter pour tout le groupe. Les <b>boucles</b>, version Python.",
        teaser:"Prochaine étape : ranger le code dans des fonctions, prêtes à resservir pour la suite du séjour.",
        intro:[
          "<code>for i in range(a, b):</code> répète le bloc pour <code>i</code> allant de <code>a</code> à <code>b - 1</code> — attention, contrairement au pseudocode, la borne <code>b</code> n'est <strong>pas incluse</strong>. C'est pour ça qu'on écrit souvent <code>range(1, n + 1)</code> pour aller « jusqu'à n inclus ».",
          "<code>range(n)</code> tout seul va de 0 à n - 1. <code>while condition:</code> fonctionne exactement comme TANT QUE."
        ],
        callout:"C'est LE piège classique de Python : range(1, 5) donne 1, 2, 3, 4 — pas 5 ! Il faut écrire range(1, 6) pour inclure 5.",
        example:{code:
`total = 0
for i in range(1, 6):
    total = total + i
print(total)`},
        exercises:[
          {
            id:"p3-1", title:"Le défi économies voyage",
            instr:'Pour financer ton prochain voyage, tu fais le défi économies : jour 1 tu mets 1€ de côté, jour 2 tu mets 2€... jusqu\'au jour <code>n</code>. Avec une boucle <code>for</code> et <code>range</code>, calcule combien tu auras économisé en tout après <code>n</code> jours dans <code>total</code>, puis affiche-la.',
            starter:
`n = 10
total = 0

for i in range():


print(total)
`,
            hints:[
              "À chaque tour de boucle, ajoute i à total : total = total + i.",
              "for i in range(1, n + 1):\n    total = total + i — n'oublie pas le +1, sinon le dernier jour est oublié !"
            ],
            solution:`n = 10\ntotal = 0\nfor i in range(1, n + 1):\n    total = total + i\nprint(total)`,
            alternatives:[
              { label:"Avec while", code:`n = 10\ntotal = 0\ni = 1\nwhile i <= n:\n    total = total + i\n    i = i + 1\nprint(total)`,
                note:"Une boucle while fait exactement la même chose ici, à condition de gérer soi-même le compteur i (le créer, l'incrémenter)." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.n!=="number") throw 0;
              let s=0; for(let i=1;i<=g.n;i++) s+=i; return s;
            }, {failMsg:(exp)=>`Le total économisé attendu était ${exp[0]}. Vérifie les bornes de range() (pense au +1 !) et que "total" part de 0.`})
          },
          {
            id:"p3-2", title:"Adapter la recette",
            instr:'La variable <code>n</code> représente les grammes de riz nécessaires pour 1 personne. Affiche, pour 1 à 10 convives, la quantité nécessaire, au format exact : <code>n x i = résultat</code> (par exemple <code>70 x 3 = 210</code>). Utilise <code>str(...)</code>.',
            starter:
`n = 70

for i in range():

`,
            hints:[
              "Une boucle for i in range(1, 11), et à l'intérieur un seul print qui construit la ligne avec des +.",
              'print(str(n) + " x " + str(i) + " = " + str(n*i))'
            ],
            solution:`n = 70\nfor i in range(1, 11):\n    print(str(n) + " x " + str(i) + " = " + str(n*i))`,
            alternatives:[
              { label:"Avec while", code:`n = 70\ni = 1\nwhile i <= 10:\n    print(str(n) + " x " + str(i) + " = " + str(n*i))\n    i = i + 1`,
                note:"Même résultat avec while, en gérant soi-même le compteur i au lieu de laisser for/range le faire." }
            ],
            checker:(r)=>oracleCheck(r,(g)=>{
              if(typeof g.n!=="number") throw 0;
              const lines=[]; for(let i=1;i<=10;i++) lines.push(`${g.n} x ${i} = ${g.n*i}`);
              return lines;
            }, {fullMatch:true, failMsg:()=>`Format attendu pour chaque ligne : "n x i = résultat", par exemple "70 x 3 = 210". Et n'oublie pas range(1, 11).`})
          }
        ]
      },
      {
        id:"p-fonctions", title:"Fonctions",
        story:"CaMI range son code dans des <b>fonctions</b> bien organisées, prêtes à resservir pour la prochaine aventure. Le voyage est bien lancé — et il reste encore de quoi s'occuper une fois sur place.",
        teaser:"Ensuite : il va falloir tout centraliser — les lieux à visiter, les plats à goûter, les épisodes du soir.",
        intro:[
          "En Python : <code>def nom(parametres):</code> puis le corps indenté, avec <code>return expression</code> pour renvoyer un résultat. On appelle la fonction avec <code>nom(valeur)</code>, comme <code>print(...)</code>.",
          "C'est la même idée qu'en pseudocode, juste avec <code>def</code> à la place de <code>FONCTION</code>, <code>return</code> à la place de <code>RETOURNER</code>, et l'indentation à la place de <code>FIN FONCTION</code>."
        ],
        callout:"Sans return, une fonction Python renvoie None (« rien ») — un oubli fréquent qui donne des résultats bizarres.",
        example:{code:
`def carre(n):
    return n * n

print(carre(6))`},
        exercises:[
          {
            id:"p4-1", title:"Fonction double portion",
            instr:'Quand tu invites deux fois plus de monde, il faut doubler les quantités de la recette. Écris une fonction <code>double(quantite)</code> qui retourne le double de <code>quantite</code>. Le code sera testé automatiquement avec plusieurs valeurs.',
            starter:
`def double(quantite):

`,
            hints:[
              "Une seule ligne suffit : return quantite * 2.",
              "def double(quantite):\n    return quantite * 2"
            ],
            solution:`def double(quantite):\n    return quantite * 2`,
            alternatives:[
              { label:"Avec une addition", code:`def double(quantite):\n    return quantite + quantite`,
                note:"quantite + quantite donne exactement le même résultat que quantite * 2 — deux écritures valables pour « doubler »." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + "\nprint(double(100))\nprint(double(250))\nprint(double(0))\n";
              const res = AlgoEngine.runPython(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["200","500","0"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, ta fonction double() fonctionne pour tous les cas testés !"};
              return {pass:false, message:`Testée sur double(100), double(250), double(0), la fonction devait renvoyer ${expected.join(", ")}.`};
            }
          },
          {
            id:"p4-2", title:"Combien de façons de regarder ta watchlist ?",
            instr:'Si tu as une liste de <code>n</code> films, combien d\'ordres différents peux-tu choisir pour les regarder un par un ? C\'est exactement <code>n!</code> (n factorielle) : n × (n-1) × ... × 1, et 0! = 1. Écris une fonction <code>fact(n)</code> qui retourne cette valeur. Essaie en récursif : la fonction s\'appelle elle-même avec n - 1.',
            starter:
`def fact(n):

`,
            hints:[
              "Le cas de base arrête la récursion : si n <= 1, retourne 1 directement.",
              "def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)"
            ],
            solution:`def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)`,
            alternatives:[
              { label:"En version itérative (sans récursion)", code:`def fact(n):\n    resultat = 1\n    for i in range(1, n + 1):\n        resultat = resultat * i\n    return resultat`,
                note:"Même résultat avec une boucle for plutôt que la fonction qui s'appelle elle-même — souvent plus facile à suivre pas à pas quand on débute." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + "\nprint(fact(0))\nprint(fact(1))\nprint(fact(5))\n";
              const res = AlgoEngine.runPython(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["1","1","120"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Parfait, fact() est correcte — même le cas récursif !"};
              return {pass:false, message:`Testée sur fact(0), fact(1), fact(5), la fonction devait renvoyer ${expected.join(", ")}. Pense au cas de base (n <= 1) qui arrête la récursion.`};
            }
          }
        ]
      },
      {
        id:"p-listes", title:"Listes",
        story:"Arrivés à destination, il faut tout centraliser autrement : la liste des lieux à visiter, celle des plats à goûter, celle des épisodes du soir. Une <b>liste</b> range plusieurs valeurs dans une seule variable — la prochaine brique du voyage.",
        teaser:"À suivre : des titres d'épisodes mal écrits et une liste de courses griffonnée à trier.",
        intro:[
          "Une liste se crée avec des crochets : <code>etapes = [\"Rome\", \"Florence\", \"Venise\"]</code>. Chaque élément a un <strong>index</strong> qui commence à 0 : <code>etapes[0]</code> donne le premier élément, <code>etapes[-1]</code> donne le dernier.",
          "<code>len(etapes)</code> donne le nombre d'éléments, <code>etapes.append(x)</code> ajoute <code>x</code> à la fin de la liste, et <code>for ville in etapes:</code> parcourt tous les éléments un par un, sans avoir besoin d'un index."
        ],
        callout:"Le premier élément d'une liste est à l'index 0, pas 1 — le même piège que pour range().",
        example:{code:
`etapes = ["Rome", "Florence", "Venise"]
print(etapes[0])
etapes.append("Milan")
print(len(etapes))
for ville in etapes:
    print(ville)`},
        exercises:[
          {
            id:"p5-1", title:"Ta liste d'étapes",
            instr:'Une liste de destinations est déjà créée : <code>etapes = ["Rome", "Florence", "Venise"]</code>. Ajoute <code>"Milan"</code> à la fin avec <code>.append(...)</code>, puis affiche la liste complète, puis son nombre d\'éléments avec <code>len(...)</code>.',
            starter:
`etapes = ["Rome", "Florence", "Venise"]

`,
            hints:[
              "Ajoute la ville avec etapes.append(\"Milan\").",
              "etapes.append(\"Milan\")\nprint(etapes)\nprint(len(etapes))"
            ],
            solution:`etapes = ["Rome", "Florence", "Venise"]\netapes.append("Milan")\nprint(etapes)\nprint(len(etapes))`,
            alternatives:[
              { label:"Avec une concaténation", code:`etapes = ["Rome", "Florence", "Venise"]\netapes = etapes + ["Milan"]\nprint(etapes)\nprint(len(etapes))`,
                note:"etapes + [\"Milan\"] construit une nouvelle liste (au lieu de modifier etapes sur place comme .append()) — utile quand on ne veut pas toucher la liste d'origine." }
            ],
            checker:(r)=>oracleCheck(r, ()=>[["Rome","Florence","Venise","Milan"], 4],
              { fmt: AlgoEngine.fmt, failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]} (la liste avec Milan ajoutée, puis sa longueur).` })
          },
          {
            id:"p5-2", title:"Le budget courses",
            instr:'La liste <code>prix</code> contient le prix de plusieurs plats à cuisiner : <code>prix = [12, 8, 15, 6]</code>. Avec une boucle <code>for</code>, additionne tous ces prix dans une variable <code>total</code>, puis affiche-la.',
            starter:
`prix = [12, 8, 15, 6]
total = 0

`,
            hints:[
              "Boucle sur chaque élément avec for p in prix:, et ajoute-le à total à chaque tour.",
              "for p in prix:\n    total = total + p\nprint(total)"
            ],
            solution:`prix = [12, 8, 15, 6]\ntotal = 0\nfor p in prix:\n    total = total + p\nprint(total)`,
            alternatives:[
              { label:"Avec sum()", code:`prix = [12, 8, 15, 6]\ntotal = sum(prix)\nprint(total)`,
                note:"sum(liste) additionne directement tous les éléments d'une liste de nombres — pratique quand on n'a pas besoin de faire autre chose pendant la boucle." }
            ],
            checker:(r)=>oracleCheck(r, ()=>41, {failMsg:()=>`Le total attendu était 41 (12 + 8 + 15 + 6). Vérifie ta boucle for et l'addition dans total.`})
          }
        ]
      },
      {
        id:"p-chaines", title:"Texte avancé",
        story:"Entre deux visites, il faut trier les titres d'épisodes mal écrits et découper la liste de courses griffonnée à la va-vite. Retour sur le <b>texte</b>, avec des outils plus puissants cette fois.",
        teaser:"Prochaine étape : associer chaque mot à sa traduction, chaque plat à son prix.",
        intro:[
          "Comme une liste, un texte peut être indexé : <code>s[0]</code> donne le premier caractère, <code>s[-1]</code> le dernier, <code>s[0:3]</code> les 3 premiers (une « tranche »).",
          "Quelques méthodes très utiles : <code>.upper()</code> / <code>.lower()</code> changent la casse, <code>.strip()</code> retire les espaces inutiles au début et à la fin, <code>.split(sep)</code> découpe le texte en une liste selon un séparateur, et <code>\"mot\" in texte</code> vérifie si un texte en contient un autre.",
          "Ces méthodes peuvent s'enchaîner : <code>titre.strip().upper()</code> retire d'abord les espaces, puis met en majuscules le résultat."
        ],
        callout:"Une méthode comme .upper() ne modifie pas le texte d'origine — elle en renvoie un nouveau. Il faut donc le stocker dans une variable si on veut le garder : propre = titre.upper().",
        example:{code:
`titre = "  le grand voyage  "
propre = titre.strip().upper()
print(propre)
print("VOYAGE" in propre)`},
        exercises:[
          {
            id:"p6-1", title:"Découper la liste de courses",
            instr:'Le texte <code>texte = "riz,tomates,basilic"</code> contient une liste de courses collée avec des virgules. Découpe-le en liste avec <code>.split(",")</code>, affiche la liste obtenue, puis son nombre d\'éléments avec <code>len(...)</code>.',
            starter:
`texte = "riz,tomates,basilic"

`,
            hints:[
              "Utilise texte.split(\",\") pour obtenir une liste à partir du texte.",
              "ingredients = texte.split(\",\")\nprint(ingredients)\nprint(len(ingredients))"
            ],
            solution:`texte = "riz,tomates,basilic"\ningredients = texte.split(",")\nprint(ingredients)\nprint(len(ingredients))`,
            alternatives:[
              { label:"Sans variable intermédiaire", code:`texte = "riz,tomates,basilic"\nprint(texte.split(","))\nprint(len(texte.split(",")))`,
                note:"On peut enchaîner .split(\",\") directement dans print() et dans len() sans passer par une variable — au prix d'un calcul répété deux fois." }
            ],
            checker:(r)=>oracleCheck(r, ()=>[["riz","tomates","basilic"], 3],
              { fmt: AlgoEngine.fmt, failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.` })
          },
          {
            id:"p6-2", title:"Le titre bien formaté",
            instr:'Le texte <code>titre = "  le voyage fantastique  "</code> est mal formaté. Nettoie-le (retire les espaces avec <code>.strip()</code>, puis mets-le en majuscules avec <code>.upper()</code>), stocke le résultat dans <code>propre</code> et affiche-le. Affiche ensuite si <code>"VOYAGE"</code> apparaît dans <code>propre</code> avec l\'opérateur <code>in</code>.',
            starter:
`titre = "  le voyage fantastique  "

`,
            hints:[
              "Tu peux enchaîner les méthodes : titre.strip().upper().",
              "propre = titre.strip().upper()\nprint(propre)\nprint(\"VOYAGE\" in propre)"
            ],
            solution:`titre = "  le voyage fantastique  "\npropre = titre.strip().upper()\nprint(propre)\nprint("VOYAGE" in propre)`,
            alternatives:[
              { label:"Dans l'autre ordre", code:`titre = "  le voyage fantastique  "\npropre = titre.upper().strip()\nprint(propre)\nprint("VOYAGE" in propre)`,
                note:"Ici, l'ordre .upper().strip() donne le même résultat que .strip().upper() — mais ce n'est pas toujours vrai pour toutes les méthodes, donc mieux vaut réfléchir à l'ordre au cas par cas." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["LE VOYAGE FANTASTIQUE","True"], {failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.`})
          }
        ]
      },
      {
        id:"p-dictionnaires", title:"Dictionnaires",
        story:"Pour s'y retrouver, CaMI associe chaque mot à sa traduction, chaque plat à son prix : direction les <b>dictionnaires</b>, pour ranger des informations par étiquette plutôt que par position.",
        teaser:"Ensuite : certaines données du voyage sont mal renseignées... il va falloir apprendre à ne pas planter.",
        intro:[
          "Un dictionnaire associe des <strong>clés</strong> à des <strong>valeurs</strong> : <code>prix = {\"pizza\": 12, \"salade\": 8}</code>. On accède à une valeur avec sa clé : <code>prix[\"pizza\"]</code> donne 12. On ajoute ou modifie une entrée avec <code>prix[\"dessert\"] = 5</code>.",
          "<code>\"pizza\" in prix</code> vérifie si une clé existe. <code>prix.get(\"dessert\", 0)</code> renvoie la valeur si la clé existe, sinon la valeur par défaut donnée (ici 0) — sans jamais planter, contrairement à <code>prix[\"dessert\"]</code> si la clé n'existe pas.",
          "<code>for cle in prix:</code> parcourt les clés du dictionnaire ; <code>prix.values()</code> donne la liste des valeurs, <code>prix.items()</code> donne des paires [clé, valeur]."
        ],
        callout:"Accéder à une clé qui n'existe pas avec crochets (prix[\"inconnu\"]) provoque une erreur — .get(...) avec une valeur par défaut permet de l'éviter.",
        example:{code:
`prix = {"pizza": 12, "salade": 8}
print(prix["pizza"])
prix["dessert"] = 5
print(prix)
print(prix.get("boisson", 0))`},
        exercises:[
          {
            id:"p7-1", title:"Le lexique de voyage",
            instr:'Un petit dictionnaire italien-français est commencé : <code>phrases = {"bonjour": "ciao", "merci": "grazie"}</code>. Ajoute la traduction de <code>"au revoir"</code> → <code>"arrivederci"</code>, affiche le dictionnaire complet, puis affiche uniquement la traduction de <code>"merci"</code>.',
            starter:
`phrases = {"bonjour": "ciao", "merci": "grazie"}

`,
            hints:[
              "Ajoute une entrée avec phrases[\"au revoir\"] = \"arrivederci\".",
              "phrases[\"au revoir\"] = \"arrivederci\"\nprint(phrases)\nprint(phrases[\"merci\"])"
            ],
            solution:`phrases = {"bonjour": "ciao", "merci": "grazie"}\nphrases["au revoir"] = "arrivederci"\nprint(phrases)\nprint(phrases["merci"])`,
            alternatives:[
              { label:"En recréant le dictionnaire", code:`phrases = {"bonjour": "ciao", "merci": "grazie", "au revoir": "arrivederci"}\nprint(phrases)\nprint(phrases["merci"])`,
                note:"Plutôt que d'ajouter une entrée après coup, on peut directement écrire le dictionnaire complet dès le départ — pratique si on connaît déjà toutes les données à l'avance." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["{'bonjour': 'ciao', 'merci': 'grazie', 'au revoir': 'arrivederci'}", "grazie"],
              { failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.` })
          },
          {
            id:"p7-2", title:"Le prix du menu",
            instr:'Le dictionnaire <code>prix = {"pizza": 12, "salade": 8}</code> contient le prix de deux plats. Affiche <code>prix.get("dessert", 0)</code> (un plat absent du menu, avec 0 par défaut). Puis, avec une boucle sur <code>.values()</code>, calcule et affiche le total de tous les prix du dictionnaire.',
            starter:
`prix = {"pizza": 12, "salade": 8}

`,
            hints:[
              "Le prix par défaut s'obtient avec prix.get(\"dessert\", 0).",
              "print(prix.get(\"dessert\", 0))\ntotal = 0\nfor v in prix.values():\n    total = total + v\nprint(total)"
            ],
            solution:`prix = {"pizza": 12, "salade": 8}\nprint(prix.get("dessert", 0))\ntotal = 0\nfor v in prix.values():\n    total = total + v\nprint(total)`,
            alternatives:[
              { label:"En parcourant les clés", code:`prix = {"pizza": 12, "salade": 8}\nprint(prix.get("dessert", 0))\ntotal = 0\nfor cle in prix:\n    total = total + prix[cle]\nprint(total)`,
                note:"for cle in prix: parcourt les clés, puis prix[cle] retrouve chaque valeur — un chemin un peu plus long que .values() pour arriver au même total." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["0","20"], {failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.`})
          }
        ]
      },
      {
        id:"p-erreurs", title:"Gestion des erreurs",
        story:"Dernière étape avant la suite de l'aventure : certaines données du voyage sont mal renseignées (un prix écrit en toutes lettres, un plat absent du menu). Plutôt que de laisser planter le programme, CaMI apprend à <b>gérer les erreurs</b> proprement.",
        teaser:"Pour finir : un dernier projet pour refermer le carnet de voyage, en rassemblant tout ce que tu as appris en Python.",
        intro:[
          "Quand une instruction risque d'échouer (une conversion invalide, une clé absente, une division par zéro...), on peut l'entourer d'un bloc <code>try: ... except: ...</code>. Le code dans <code>try</code> s'exécute normalement ; s'il provoque une erreur, Python arrête ce bloc et exécute directement le bloc <code>except</code> à la place — sans planter le programme.",
          "C'est utile chaque fois qu'une donnée n'est pas garantie fiable : un texte qui n'est pas vraiment un nombre, une clé de dictionnaire qui n'existe peut-être pas, un index de liste qui dépasse."
        ],
        callout:"try/except n'est pas fait pour cacher ses propres bugs — c'est un outil pour gérer des situations qu'on ne peut pas totalement contrôler à l'avance (des données extérieures imparfaites, par exemple).",
        example:{code:
`textes = ["25", "gratuit", "12"]
for t in textes:
    try:
        print(int(t))
    except:
        print("prix invalide")`},
        exercises:[
          {
            id:"p8-1", title:"Convertir sans planter",
            instr:'Certains prix du voyage sont mal renseignés (du texte au lieu d\'un nombre). Écris une fonction <code>vers_nombre(texte)</code> qui essaie de convertir <code>texte</code> en nombre entier avec <code>int(...)</code> ; si la conversion échoue, elle retourne 0 au lieu de planter. Utilise <code>try</code> / <code>except</code>.',
            starter:
`def vers_nombre(texte):

`,
            hints:[
              "Mets la conversion dans un bloc try, et retourne 0 dans le except.",
              "def vers_nombre(texte):\n    try:\n        return int(texte)\n    except:\n        return 0"
            ],
            solution:`def vers_nombre(texte):\n    try:\n        return int(texte)\n    except:\n        return 0`,
            alternatives:[
              { label:"En nommant l'erreur", code:`def vers_nombre(texte):\n    try:\n        return int(texte)\n    except Exception as e:\n        return 0`,
                note:"except Exception as e: fonctionne comme except: ici (e n'est pas utilisée) — nommer l'erreur devient utile si on veut plus tard afficher ou inspecter le message." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + '\nprint(vers_nombre("25"))\nprint(vers_nombre("gratuit"))\nprint(vers_nombre("12"))\n';
              const res = AlgoEngine.runPython(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["25","0","12"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, vers_nombre() convertit ou retombe sur ses pieds dans tous les cas testés !"};
              return {pass:false, message:`Testée sur "25", "gratuit", "12", la fonction devait renvoyer ${expected.join(", ")}. Le except doit intercepter l'échec de la conversion.`};
            }
          },
          {
            id:"p8-2", title:"Chercher un plat au menu",
            instr:'Le dictionnaire <code>menu</code> contient les plats disponibles et leur prix. Écris une fonction <code>prix_du_plat(menu, nom)</code> qui retourne le prix du plat <code>nom</code>, ou <code>"indisponible"</code> si ce plat n\'est pas dans le menu — utilise <code>try</code> / <code>except</code> pour éviter que le programme plante si la clé n\'existe pas.',
            starter:
`def prix_du_plat(menu, nom):

`,
            hints:[
              "Essaie de retourner menu[nom] dans un try, et retourne \"indisponible\" dans le except.",
              "def prix_du_plat(menu, nom):\n    try:\n        return menu[nom]\n    except:\n        return \"indisponible\""
            ],
            solution:`def prix_du_plat(menu, nom):\n    try:\n        return menu[nom]\n    except:\n        return "indisponible"`,
            alternatives:[
              { label:"Avec l'opérateur in (sans try/except)", code:`def prix_du_plat(menu, nom):\n    if nom in menu:\n        return menu[nom]\n    return "indisponible"`,
                note:"Ici, on peut aussi éviter l'erreur en amont avec if nom in menu: plutôt qu'en la rattrapant après coup avec try/except — les deux approches sont valables selon les cas." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + '\nmenu = {"pizza": 12, "salade": 8}\nprint(prix_du_plat(menu, "pizza"))\nprint(prix_du_plat(menu, "tiramisu"))\nprint(prix_du_plat(menu, "salade"))\n';
              const res = AlgoEngine.runPython(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["12","indisponible","8"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Parfait, prix_du_plat() gère aussi bien les plats connus que les plats absents !"};
              return {pass:false, message:`Testée sur "pizza", "tiramisu", "salade", la fonction devait renvoyer ${expected.join(", ")}.`};
            }
          }
        ]
      },
      {
        id:"p-projet", title:"Projet : le carnet de voyage",
        story:"Le voyage touche à sa fin. Avant de rentrer, CaMI veut refermer le carnet de voyage avec un dernier programme qui rassemble tout : listes, dictionnaires, texte et gestion des erreurs.",
        intro:[
          "Ce chapitre n'introduit aucune nouvelle notion : c'est l'occasion de combiner tout ce que tu as appris en Python — <strong>listes</strong>, <strong>dictionnaires</strong>, <strong>chaînes</strong> et <strong>gestion des erreurs</strong> — dans un dernier petit projet.",
          "Chaque étape s'appuie sur les précédentes. Si tu bloques, c'est normal : relis le chapitre correspondant à la notion utilisée, rien de nouveau n'est demandé ici."
        ],
        callout:"Un projet, c'est juste plusieurs briques que tu connais déjà, assemblées ensemble. Prends ton temps sur chaque étape — c'est le dernier effort avant l'arrivée !",
        example:{code:
`etapes = ["Rome", "Florence"]
prix = {"Rome": 120, "Florence": 95}
for ville in etapes:
    try:
        print(ville + " : " + str(prix[ville]))
    except:
        print(ville + " : indisponible")`},
        exercises:[
          {
            id:"pproj-1", title:"Étape 1 — Numéroter les étapes",
            instr:'La liste <code>etapes = ["Rome", "Florence", "Venise"]</code> est déjà créée. Affiche chaque étape précédée de son numéro (en partant de 1), au format exact <code>"1. Rome"</code>. Utilise une boucle <code>for i in range(len(...)):</code>.',
            starter:
`etapes = ["Rome", "Florence", "Venise"]

for i in range():

`,
            hints:[
              "Le nombre d'étapes s'obtient avec len(etapes), et l'indice i va de 0 à len(etapes) - 1.",
              'for i in range(len(etapes)):\n    print(str(i + 1) + ". " + etapes[i])'
            ],
            solution:`etapes = ["Rome", "Florence", "Venise"]\nfor i in range(len(etapes)):\n    print(str(i + 1) + ". " + etapes[i])`,
            alternatives:[
              { label:"Avec un compteur manuel", code:`etapes = ["Rome", "Florence", "Venise"]\nnumero = 1\nfor ville in etapes:\n    print(str(numero) + ". " + ville)\n    numero = numero + 1`,
                note:"On peut aussi parcourir directement les villes avec for ville in etapes:, en gérant soi-même un compteur numero — plutôt que de passer par un indice i et range(len(...))." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["1. Rome","2. Florence","3. Venise"], {fullMatch:true,
              failMsg:(exp)=>`Format attendu pour chaque ligne : "numéro. ville", par exemple "1. Rome". Attendu : ${exp.join(" / ")}.`})
          },
          {
            id:"pproj-2", title:"Étape 2 — Le carnet des avis",
            instr:'Un dictionnaire d\'avis est commencé : <code>avis = {"Rome": "Fantastique", "Florence": "Sympa"}</code>. Ajoute ton avis sur <code>"Venise"</code> → <code>"Magnifique"</code>, affiche le dictionnaire complet, puis affiche <code>avis.get("Milan", "pas encore visitee")</code> (une ville pas encore ajoutée).',
            starter:
`avis = {"Rome": "Fantastique", "Florence": "Sympa"}

`,
            hints:[
              "Ajoute une entrée avec avis[\"Venise\"] = \"Magnifique\".",
              "avis[\"Venise\"] = \"Magnifique\"\nprint(avis)\nprint(avis.get(\"Milan\", \"pas encore visitee\"))"
            ],
            solution:`avis = {"Rome": "Fantastique", "Florence": "Sympa"}\navis["Venise"] = "Magnifique"\nprint(avis)\nprint(avis.get("Milan", "pas encore visitee"))`,
            alternatives:[
              { label:"En recréant le dictionnaire", code:`avis = {"Rome": "Fantastique", "Florence": "Sympa", "Venise": "Magnifique"}\nprint(avis)\nprint(avis.get("Milan", "pas encore visitee"))`,
                note:"Plutôt que d'ajouter une entrée après coup, on peut directement écrire le dictionnaire complet dès le départ — pratique si on connaît déjà toutes les données à l'avance." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["{'Rome': 'Fantastique', 'Florence': 'Sympa', 'Venise': 'Magnifique'}", "pas encore visitee"],
              { failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.` })
          },
          {
            id:"pproj-3", title:"Étape 3 — Nettoyer une note du carnet",
            instr:'Une note griffonnée pendant le voyage est mal formatée : <code>note = "  incroyable coucher de soleil  "</code>. Nettoie-la avec <code>.strip()</code>, stocke le résultat dans <code>propre</code> et affiche-le. Affiche ensuite si le mot <code>"soleil"</code> apparaît dans <code>propre</code>, avec l\'opérateur <code>in</code>.',
            starter:
`note = "  incroyable coucher de soleil  "

`,
            hints:[
              "Le nettoyage s'obtient avec note.strip().",
              "propre = note.strip()\nprint(propre)\nprint(\"soleil\" in propre)"
            ],
            solution:`note = "  incroyable coucher de soleil  "\npropre = note.strip()\nprint(propre)\nprint("soleil" in propre)`,
            alternatives:[
              { label:"Sans variable intermédiaire", code:`note = "  incroyable coucher de soleil  "\nprint(note.strip())\nprint("soleil" in note.strip())`,
                note:"On peut enchaîner .strip() directement dans print() et dans le test in, sans passer par une variable — au prix d'un calcul répété deux fois." }
            ],
            checker:(r)=>oracleCheck(r, ()=>["incroyable coucher de soleil","True"], {failMsg:(exp)=>`Il fallait afficher ${exp[0]} puis ${exp[1]}.`})
          },
          {
            id:"pproj-4", title:"Étape 4 — Le prix d'une étape, sans planter",
            instr:'Le dictionnaire <code>prix</code> contient le coût de certaines étapes du voyage. Écris une fonction <code>prix_etape(prix, ville)</code> qui retourne le prix de <code>ville</code> s\'il est connu, ou <code>"indisponible"</code> sinon — utilise <code>try</code> / <code>except</code> pour éviter que le programme plante si la ville n\'est pas dans le dictionnaire.',
            starter:
`def prix_etape(prix, ville):

`,
            hints:[
              "Essaie de retourner prix[ville] dans un try, et retourne \"indisponible\" dans le except.",
              "def prix_etape(prix, ville):\n    try:\n        return prix[ville]\n    except:\n        return \"indisponible\""
            ],
            solution:`def prix_etape(prix, ville):\n    try:\n        return prix[ville]\n    except:\n        return "indisponible"`,
            alternatives:[
              { label:"Avec l'opérateur in (sans try/except)", code:`def prix_etape(prix, ville):\n    if ville in prix:\n        return prix[ville]\n    return "indisponible"`,
                note:"Ici, on peut aussi éviter l'erreur en amont avec if ville in prix: plutôt qu'en la rattrapant après coup avec try/except — les deux approches sont valables." }
            ],
            checker:(r,studentCode)=>{
              const full = studentCode + '\nprix = {"Rome": 120, "Florence": 95}\nprint(prix_etape(prix, "Rome"))\nprint(prix_etape(prix, "Venise"))\nprint(prix_etape(prix, "Florence"))\n';
              const res = AlgoEngine.runPython(full);
              if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
              const expected=["120","indisponible","95"];
              const tail=res.output.slice(res.output.length-3);
              if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Le carnet de voyage est complet — bravo pour ce beau parcours !"};
              return {pass:false, message:`Testée sur "Rome", "Venise", "Florence", la fonction devait renvoyer ${expected.join(", ")}.`};
            }
          }
        ]
      }
    ]
  },
avance: {
  id:"avance", label:"Partie 3", shortLabel:"Avancé", langTag:"python avancé",
  run:(src)=>AlgoEngine.runPython(src),
  chapters:[
    {
      id:"pa-boucles", title:"Boucles avancées : break et continue",
      teaser:"De retour à la maison, nouveaux projets en tête : CaMI veut des outils plus costauds, à commencer par un meilleur contrôle des boucles.",
      story:"De retour à la maison, CaMI a plein d'idées de nouveaux projets — mais ils demandent des outils plus costauds que ceux du voyage. Premier arrêt : mieux contrôler les boucles.",
      intro:[
        "Jusqu'ici, une boucle allait toujours jusqu'au bout de son parcours. Deux mots-clés permettent de mieux la piloter : <strong>break</strong> arrête complètement la boucle immédiatement, et <strong>continue</strong> saute directement à l'itération suivante sans exécuter le reste du tour en cours.",
        "Ce sont des outils très utilisés en pratique : chercher un élément et s'arrêter dès qu'on l'a trouvé (inutile de continuer), ou ignorer certaines valeurs sans les traiter."
      ],
      callout:"<b>break</b> sort de la boucle pour de bon, même s'il restait des tours à faire. <b>continue</b> ne saute que le tour en cours — la boucle continue ensuite normalement.",
      example:{code:
`for nombre in [4, 7, 2, 9, 1]:
    if nombre > 8:
        print("trouve : " + str(nombre))
        break
    print("essai : " + str(nombre))`},
      exercises:[
        {
          id:"paboucle-1", title:"Le premier multiple de 7",
          instr:`Parcours les nombres de 1 à 50 avec <code>for i in range(1, 51):</code>. Affiche le premier multiple de 7 rencontré (utilise <code>i % 7 == 0</code>), puis arrête immédiatement la boucle avec <code>break</code>.`,
          starter:`for i in range(1, 51):
`,
          hints:[
            `Teste i % 7 == 0 pour savoir si i est un multiple de 7 — puis print(i) et break dans le même bloc if.`,
            `for i in range(1, 51):
    if i % 7 == 0:
        print(i)
        break`
          ],
          solution:`for i in range(1, 51):
    if i % 7 == 0:
        print(i)
        break`,
          checker:(r)=>outputCheck(r, ["7"], {fullMatch:true, failMsg:()=>'Il fallait afficher uniquement "7" (le premier multiple de 7), puis arrêter la boucle avec break.'})
        },
        {
          id:"paboucle-2", title:"Ignorer les nombres négatifs",
          instr:`La liste <code>mesures = [12, -4, 8, -1, 5, -9, 3]</code> contient des mesures, certaines négatives (des erreurs de capteur). Affiche uniquement les mesures positives ou nulles, en utilisant <code>continue</code> pour sauter les négatives.`,
          starter:`mesures = [12, -4, 8, -1, 5, -9, 3]

for m in mesures:
`,
          hints:[
            `Si m < 0, utilise continue pour passer directement au tour suivant, sans afficher m.`,
            `mesures = [12, -4, 8, -1, 5, -9, 3]
for m in mesures:
    if m < 0:
        continue
    print(m)`
          ],
          solution:`mesures = [12, -4, 8, -1, 5, -9, 3]
for m in mesures:
    if m < 0:
        continue
    print(m)`,
          checker:(r)=>outputCheck(r, ["12","8","5","3"], {fullMatch:true, failMsg:(exp)=>`Il fallait afficher uniquement les mesures positives ou nulles, dans l'ordre : ${exp.join(", ")}.`})
        },
        {
          id:"paboucle-3", title:"Le mot de passe (essais limités)",
          instr:`Le bon mot de passe est <code>"soleil42"</code>. La liste <code>essais = ["azerty", "soleil42", "motdepasse"]</code> simule des tentatives. Parcours-la : si une tentative est correcte, affiche <code>"acces autorise"</code> et arrête la boucle avec <code>break</code> — sinon affiche <code>"tentative refusee"</code> et continue.`,
          starter:`bon_mdp = "soleil42"
essais = ["azerty", "soleil42", "motdepasse"]

for tentative in essais:
`,
          hints:[
            `Compare tentative == bon_mdp ; si c'est vrai, affiche le succès puis break, sinon affiche l'échec.`,
            `bon_mdp = "soleil42"
essais = ["azerty", "soleil42", "motdepasse"]
for tentative in essais:
    if tentative == bon_mdp:
        print("acces autorise")
        break
    print("tentative refusee")`
          ],
          solution:`bon_mdp = "soleil42"
essais = ["azerty", "soleil42", "motdepasse"]
for tentative in essais:
    if tentative == bon_mdp:
        print("acces autorise")
        break
    print("tentative refusee")`,
          checker:(r)=>outputCheck(r, ["tentative refusee","acces autorise"], {fullMatch:true, failMsg:(exp)=>`Attendu : ${exp.join(" puis ")} (et rien après, grâce à break).`})
        }
      ]
    },
    {
      id:"pa-fonctions", title:"Fonctions avancées : les arguments *args",
      teaser:"Prochaine étape : des fonctions capables d'accepter autant d'arguments qu'on veut, sans les compter à l'avance.",
      story:"CaMI veut des fonctions plus souples, capables d'accepter un nombre variable d'informations — sans savoir à l'avance combien on va lui en donner.",
      intro:[
        "Jusqu'ici, une fonction attendait un nombre fixe de paramètres. Avec <code>*args</code> (le nom <code>args</code> est une simple convention, tu peux en choisir un autre), une fonction peut accepter <strong>autant d'arguments que tu veux</strong> — ils arrivent regroupés dans une liste.",
        "C'est très pratique quand on ne connaît pas à l'avance combien de valeurs on va fournir : additionner 2 nombres ou 10, saluer 1 ami ou toute une bande."
      ],
      callout:"Un paramètre précédé d'une étoile (<code>*nom</code>) doit être <b>le dernier</b> de la liste des paramètres. Tous les arguments fournis en trop sont automatiquement rangés dans une liste portant ce nom.",
      example:{code:
`def total(*nombres):
    s = 0
    for n in nombres:
        s = s + n
    return s

print(total(1, 2, 3))
print(total(10, 20))`},
      exercises:[
        {
          id:"pafonc-1", title:"Le plus grand du groupe",
          instr:`Écris une fonction <code>plus_grand(*nombres)</code> qui retourne le plus grand nombre parmi tous les arguments reçus (utilise <code>max()</code> sur la liste <code>nombres</code>).`,
          starter:`def plus_grand(*nombres):
`,
          hints:[
            `max(nombres) retourne directement le plus grand élément d'une liste.`,
            `def plus_grand(*nombres):
    return max(nombres)`
          ],
          solution:`def plus_grand(*nombres):
    return max(nombres)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(plus_grand(3, 7, 2))
print(plus_grand(10))
print(plus_grand(-5, -1, -9))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["7","10","-1"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs groupes de nombres, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"pafonc-2", title:"Présenter le groupe de voyageurs",
          instr:`Écris une fonction <code>presenter(*noms)</code> qui affiche le nombre de voyageurs suivi de la liste des noms séparés par des virgules — par exemple <code>presenter("Aria", "Leo")</code> doit afficher <code>"2 voyageurs : Aria, Leo"</code>. Utilise <code>len(noms)</code> et <code>", ".join(noms)</code>.`,
          starter:`def presenter(*noms):
`,
          hints:[
            `len(noms) donne le nombre de voyageurs, et ", ".join(noms) assemble les noms séparés par des virgules.`,
            `def presenter(*noms):
    print(str(len(noms)) + " voyageurs : " + ", ".join(noms))`
          ],
          solution:`def presenter(*noms):
    print(str(len(noms)) + " voyageurs : " + ", ".join(noms))`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
presenter("Aria", "Leo")
presenter("Mia", "Noa", "Theo")
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["2 voyageurs : Aria, Leo","3 voyageurs : Mia, Noa, Theo"];
            if(JSON.stringify(res.output)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Attendu : ${expected.join(" puis ")}.`};
          }
        },
        {
          id:"pafonc-3", title:"Moyenne d'un nombre quelconque de notes",
          instr:`Écris une fonction <code>moyenne(*notes)</code> qui retourne la moyenne des notes reçues. S'il n'y a aucune note, retourne <code>0</code>.`,
          starter:`def moyenne(*notes):
`,
          hints:[
            `Si len(notes) == 0, retourne 0 directement. Sinon, retourne sum(notes) / len(notes).`,
            `def moyenne(*notes):
    if len(notes) == 0:
        return 0
    return sum(notes) / len(notes)`
          ],
          solution:`def moyenne(*notes):
    if len(notes) == 0:
        return 0
    return sum(notes) / len(notes)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(moyenne(10, 15, 20))
print(moyenne())
print(moyenne(8))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["15","0","8"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs cas, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        }
      ]
    },
    {
      id:"pa-comprehensions", title:"Compréhensions de liste",
      teaser:"Ensuite : une syntaxe Python pour construire une liste en une seule ligne, directement à partir d'une autre.",
      story:"CaMI a pris goût à écrire du code court et élégant. Une syntaxe Python permet de construire une liste en une seule ligne, à partir d'une autre : la compréhension de liste.",
      intro:[
        "Une <strong>compréhension de liste</strong> transforme un <code>for</code> qui construit une liste en une seule ligne : <code>[expression for variable in iterable]</code>. C'est strictement équivalent à une boucle qui fait <code>.append()</code> à chaque tour, mais en plus court.",
        "On peut aussi filtrer les éléments avec un <code>if</code> à la fin : <code>[expression for variable in iterable if condition]</code> ne garde que les éléments qui passent le test. La même idée fonctionne aussi pour construire un dictionnaire : <code>{cle: valeur for variable in iterable}</code>."
      ],
      callout:"Une compréhension de liste ne fait rien de nouveau — c'est juste une autre façon d'écrire une boucle qui construit une liste. Les deux styles sont valables ; la compréhension est simplement plus concise pour les cas simples.",
      example:{code:
`nombres = [1, 2, 3, 4, 5]
carres = [n * n for n in nombres]
print(carres)

pairs = [n for n in nombres if n % 2 == 0]
print(pairs)`},
      exercises:[
        {
          id:"pacomp-1", title:"Convertir des degrés",
          instr:`La liste <code>celsius = [0, 10, 20, 30, 100]</code> contient des températures en degrés Celsius. Construis une liste <code>fahrenheit</code> par compréhension, où chaque valeur vaut <code>c * 9 / 5 + 32</code>, puis affiche-la.`,
          starter:`celsius = [0, 10, 20, 30, 100]
`,
          hints:[
            `fahrenheit = [c * 9 / 5 + 32 for c in celsius]`,
            `celsius = [0, 10, 20, 30, 100]
fahrenheit = [c * 9 / 5 + 32 for c in celsius]
print(fahrenheit)`
          ],
          solution:`celsius = [0, 10, 20, 30, 100]
fahrenheit = [c * 9 / 5 + 32 for c in celsius]
print(fahrenheit)`,
          checker:(r)=>oracleCheck(r, ()=>[32, 50, 68, 86, 212], {singleValue:true, fmt: AlgoEngine.fmt,
            failMsg:(exp)=>`La liste attendue était ${exp[0]}.`})
        },
        {
          id:"pacomp-2", title:"Les mots de plus de 4 lettres",
          instr:`La liste <code>mots = ["chat", "programmation", "python", "IA", "algorithme"]</code> est donnée. Construis par compréhension la liste <code>longs</code> contenant seulement les mots dont la longueur est strictement supérieure à 4, puis affiche-la.`,
          starter:`mots = ["chat", "programmation", "python", "IA", "algorithme"]
`,
          hints:[
            `Utilise len(m) > 4 comme condition dans la compréhension.`,
            `mots = ["chat", "programmation", "python", "IA", "algorithme"]
longs = [m for m in mots if len(m) > 4]
print(longs)`
          ],
          solution:`mots = ["chat", "programmation", "python", "IA", "algorithme"]
longs = [m for m in mots if len(m) > 4]
print(longs)`,
          checker:(r)=>oracleCheck(r, ()=>["programmation","python","algorithme"], {singleValue:true, fmt: AlgoEngine.fmt,
            failMsg:(exp)=>`La liste attendue était ${exp[0]}.`})
        },
        {
          id:"pacomp-3", title:"Chaque mot avec sa longueur",
          instr:`À partir de <code>mots = ["sac", "valise", "passeport"]</code>, construis par compréhension un dictionnaire <code>longueurs</code> qui associe chaque mot à sa longueur, puis affiche-le.`,
          starter:`mots = ["sac", "valise", "passeport"]
`,
          hints:[
            `La syntaxe est {mot: len(mot) for mot in mots} — comme une liste en compréhension, mais avec une paire clé:valeur.`,
            `mots = ["sac", "valise", "passeport"]
longueurs = {mot: len(mot) for mot in mots}
print(longueurs)`
          ],
          solution:`mots = ["sac", "valise", "passeport"]
longueurs = {mot: len(mot) for mot in mots}
print(longueurs)`,
          checker:(r)=>{
            if(!r.success) return {pass:false, message:"Il y a une erreur dans le code" + (r.error.line?` (ligne ${r.error.line})`:"") + " : " + r.error.message};
            const expected = "{'sac': 3, 'valise': 6, 'passeport': 9}";
            if(r.output.length && r.output[r.output.length-1]===expected) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Le dictionnaire attendu était ${expected}.`};
          }
        }
      ]
    },
    {
      id:"pa-recursivite", title:"La récursivité",
      teaser:"À suivre : une idée un peu vertigineuse — une fonction qui s'appelle elle-même.",
      story:"Pour calculer certaines quantités, CaMI découvre une idée un peu vertigineuse : une fonction qui s'appelle elle-même.",
      intro:[
        "Une fonction <strong>récursive</strong> est une fonction qui s'appelle elle-même, avec un problème un peu plus petit à chaque fois. Elle a toujours besoin de deux choses : un <strong>cas de base</strong> (la situation la plus simple, où la fonction s'arrête et retourne directement une réponse) et un <strong>cas récursif</strong> (où elle se rappelle elle-même sur un problème réduit).",
        "Sans cas de base, une fonction récursive ne s'arrête jamais — jusqu'à ce que l'interpréteur, ici comme en vrai Python, refuse de continuer (erreur de récursion trop profonde)."
      ],
      callout:"Astuce pour écrire une fonction récursive : commence toujours par te demander « quel est le cas le plus simple, où je connais déjà la réponse sans calculer ? » — c'est ton cas de base.",
      example:{code:
`def compte_a_rebours(n):
    if n == 0:
        print("Decollage !")
        return
    print(n)
    compte_a_rebours(n - 1)

compte_a_rebours(3)`},
      exercises:[
        {
          id:"parec-1", title:"La factorielle",
          instr:`Écris une fonction récursive <code>factorielle(n)</code> qui retourne <code>n!</code> (le produit de tous les entiers de 1 à n). Cas de base : <code>factorielle(0)</code> vaut <code>1</code>. Cas récursif : <code>factorielle(n) = n * factorielle(n - 1)</code>.`,
          starter:`def factorielle(n):
`,
          hints:[
            `Le cas de base est n == 0, qui retourne 1 directement sans appel récursif.`,
            `def factorielle(n):
    if n == 0:
        return 1
    return n * factorielle(n - 1)`
          ],
          solution:`def factorielle(n):
    if n == 0:
        return 1
    return n * factorielle(n - 1)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(factorielle(0))
print(factorielle(1))
print(factorielle(5))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["1","1","120"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur 0, 1 et 5, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"parec-2", title:"La somme d'une liste, sans sum()",
          instr:`Sans utiliser <code>sum()</code>, écris une fonction récursive <code>somme_liste(nombres)</code> qui retourne la somme des éléments de la liste. Cas de base : liste vide → <code>0</code>. Cas récursif : le premier élément <code>nombres[0]</code> plus la somme du reste <code>nombres[1:]</code>.`,
          starter:`def somme_liste(nombres):
`,
          hints:[
            `Le cas de base est len(nombres) == 0, qui retourne 0. Sinon : nombres[0] + somme_liste(nombres[1:]).`,
            `def somme_liste(nombres):
    if len(nombres) == 0:
        return 0
    return nombres[0] + somme_liste(nombres[1:])`
          ],
          solution:`def somme_liste(nombres):
    if len(nombres) == 0:
        return 0
    return nombres[0] + somme_liste(nombres[1:])`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(somme_liste([]))
print(somme_liste([4]))
print(somme_liste([1, 2, 3, 4, 5]))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["0","4","15"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs listes, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"parec-3", title:"Compte à rebours",
          instr:`Écris une fonction récursive <code>compte_a_rebours(n)</code> qui affiche chaque nombre de <code>n</code> jusqu'à 1 (un par ligne), puis affiche <code>"Decollage !"</code> quand elle atteint 0.`,
          starter:`def compte_a_rebours(n):
`,
          hints:[
            `Cas de base : si n == 0, affiche "Decollage !" et arrête (return). Sinon, affiche n puis rappelle compte_a_rebours(n - 1).`,
            `def compte_a_rebours(n):
    if n == 0:
        print("Decollage !")
        return
    print(n)
    compte_a_rebours(n - 1)`
          ],
          solution:`def compte_a_rebours(n):
    if n == 0:
        print("Decollage !")
        return
    print(n)
    compte_a_rebours(n - 1)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
compte_a_rebours(4)
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["4","3","2","1","Decollage !"];
            if(JSON.stringify(res.output)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Attendu : ${expected.join(", ")}.`};
          }
        }
      ]
    },
    {
      id:"pa-poo", title:"Programmation orientée objet : les classes",
      teaser:"Prochaine étape : représenter des personnages avec leur propre nom, leurs propres points de vie — la programmation orientée objet.",
      story:"Pour son prochain projet — un petit jeu de voyage — CaMI a besoin de représenter des personnages avec leur propre nom, leurs propres points de vie... Bienvenue dans la programmation orientée objet.",
      intro:[
        "Une <strong>classe</strong> est un modèle pour créer des <strong>objets</strong> : elle décrit quelles informations (les attributs) et quelles actions (les méthodes) chaque objet possédera. Chaque objet créé à partir d'une classe est une <strong>instance</strong>, indépendante des autres.",
        "La méthode spéciale <code>__init__(self, ...)</code> s'exécute automatiquement à la création d'un objet — c'est le constructeur, qui initialise ses attributs. Le premier paramètre de chaque méthode, toujours nommé <code>self</code> par convention, représente l'objet lui-même : <code>self.nom</code> lit ou modifie l'attribut <code>nom</code> de CET objet précis."
      ],
      callout:"Ce mini-interpréteur couvre les classes de base (attributs, méthodes, plusieurs instances indépendantes) mais pas l'héritage (une classe qui hérite d'une autre) — une notion plus avancée, à explorer plus tard avec un vrai Python.",
      example:{code:
`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv

    def se_presenter(self):
        return self.nom + " (" + str(self.pv) + " PV)"

heros = Personnage("Aria", 100)
print(heros.se_presenter())`},
      exercises:[
        {
          id:"papoo-1", title:"Ta première classe",
          instr:`Crée une classe <code>Personnage</code> avec un constructeur <code>__init__(self, nom, pv)</code> qui stocke <code>nom</code> et <code>pv</code> dans <code>self.nom</code> et <code>self.pv</code>. Ajoute une méthode <code>se_presenter(self)</code> qui retourne <code>self.nom + " a " + str(self.pv) + " PV"</code>. Crée ensuite <code>heros = Personnage("Aria", 100)</code> et affiche <code>heros.se_presenter()</code>.`,
          starter:`class Personnage:
`,
          hints:[
            `N'oublie pas l'indentation : def __init__(self, nom, pv): doit être à l'intérieur de la classe (indenté une fois), et son corps encore indenté une fois de plus.`,
            `class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
    def se_presenter(self):
        return self.nom + " a " + str(self.pv) + " PV"

heros = Personnage("Aria", 100)
print(heros.se_presenter())`
          ],
          solution:`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
    def se_presenter(self):
        return self.nom + " a " + str(self.pv) + " PV"

heros = Personnage("Aria", 100)
print(heros.se_presenter())`,
          checker:(r)=>outputCheck(r, ["Aria a 100 PV"], {fullMatch:true, failMsg:()=>'heros.se_presenter() devait afficher "Aria a 100 PV".'})
        },
        {
          id:"papoo-2", title:"Encaisser des dégâts",
          instr:`Reprends la classe <code>Personnage</code> (constructeur avec <code>nom</code> et <code>pv</code>). Ajoute une méthode <code>subir_degats(self, degats)</code> qui retire <code>degats</code> aux PV (<code>self.pv -= degats</code>). Crée <code>heros = Personnage("Aria", 100)</code>, appelle <code>heros.subir_degats(30)</code> puis affiche <code>heros.pv</code>.`,
          starter:`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
`,
          hints:[
            `self.pv -= degats fonctionne exactement comme pour une variable normale.`,
            `class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
    def subir_degats(self, degats):
        self.pv -= degats

heros = Personnage("Aria", 100)
heros.subir_degats(30)
print(heros.pv)`
          ],
          solution:`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
    def subir_degats(self, degats):
        self.pv -= degats

heros = Personnage("Aria", 100)
heros.subir_degats(30)
print(heros.pv)`,
          checker:(r)=>outputCheck(r, ["70"], {fullMatch:true, failMsg:()=>"Après 30 dégâts sur 100 PV, il fallait afficher 70."})
        },
        {
          id:"papoo-3", title:"Toute l'équipe",
          instr:`Crée trois personnages avec la classe <code>Personnage</code> (constructeur <code>nom, pv</code>) : <code>Personnage("Aria", 100)</code>, <code>Personnage("Leo", 80)</code>, <code>Personnage("Mia", 90)</code>, range-les dans une liste <code>equipe</code>, puis affiche le nom de chacun avec une boucle <code>for</code>.`,
          starter:`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv
`,
          hints:[
            `equipe = [Personnage("Aria", 100), Personnage("Leo", 80), Personnage("Mia", 90)] puis for p in equipe: print(p.nom)`,
            `class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv

equipe = [Personnage("Aria", 100), Personnage("Leo", 80), Personnage("Mia", 90)]
for p in equipe:
    print(p.nom)`
          ],
          solution:`class Personnage:
    def __init__(self, nom, pv):
        self.nom = nom
        self.pv = pv

equipe = [Personnage("Aria", 100), Personnage("Leo", 80), Personnage("Mia", 90)]
for p in equipe:
    print(p.nom)`,
          checker:(r)=>outputCheck(r, ["Aria","Leo","Mia"], {fullMatch:true, failMsg:(exp)=>`Attendu : ${exp.join(", ")}.`})
        },
        {
          id:"papoo-4", title:"Le panier extensible",
          instr:`Crée une classe <code>Panier</code> avec un constructeur <code>__init__(self)</code> qui initialise <code>self.articles = []</code>, et une méthode <code>ajouter(self, *items)</code> qui ajoute chaque article de <code>items</code> à <code>self.articles</code> (avec <code>.append()</code>). Crée <code>p = Panier()</code>, appelle <code>p.ajouter("pomme", "pain", "lait")</code>, puis affiche <code>p.articles</code>.`,
          starter:`class Panier:
    def __init__(self):
        self.articles = []
`,
          hints:[
            `Dans ajouter, parcours items avec une boucle for et fais self.articles.append(item) à chaque tour.`,
            `class Panier:
    def __init__(self):
        self.articles = []
    def ajouter(self, *items):
        for item in items:
            self.articles.append(item)

p = Panier()
p.ajouter("pomme", "pain", "lait")
print(p.articles)`
          ],
          solution:`class Panier:
    def __init__(self):
        self.articles = []
    def ajouter(self, *items):
        for item in items:
            self.articles.append(item)

p = Panier()
p.ajouter("pomme", "pain", "lait")
print(p.articles)`,
          checker:(r)=>oracleCheck(r, ()=>["pomme","pain","lait"], {singleValue:true, fmt: AlgoEngine.fmt,
            failMsg:(exp)=>`La liste attendue était ${exp[0]}.`})
        }
      ]
    },
    {
      id:"pa-fichiers", title:"Fichiers : lire et écrire des données",
      teaser:"Ensuite : faire en sorte que les notes de CaMI survivent au-delà d'un seul programme.",
      story:"CaMI veut que ses notes de voyage survivent au-delà d'un seul programme : il faut pouvoir les écrire quelque part, puis les relire plus tard.",
      intro:[
        "En vrai Python, on lit et on écrit des fichiers avec <code>open()</code>. Ce mini-interpréteur propose une version simplifiée avec deux fonctions : <code>write_file(nom, contenu)</code> écrit du texte dans un fichier (le crée s'il n'existe pas, ou l'écrase s'il existe déjà), et <code>read_file(nom)</code> relit ce texte.",
        "Une troisième fonction, <code>file_exists(nom)</code>, permet de vérifier si un fichier existe déjà avant d'essayer de le lire — utile pour éviter une erreur."
      ],
      callout:"Dans cet environnement d'apprentissage, les fichiers créés n'existent que le temps d'une exécution (quand tu cliques sur « Vérifier » ou « Exécuter ») — c'est une version simplifiée pour comprendre le principe, pas un vrai disque dur.",
      example:{code:
`write_file("journal.txt", "Jour 1 : arrivee a Rome")
contenu = read_file("journal.txt")
print(contenu)`},
      exercises:[
        {
          id:"pafich-1", title:"Écrire puis relire",
          instr:`Écris dans un fichier <code>"notes.txt"</code> le texte <code>"Superbe voyage"</code> avec <code>write_file()</code>, puis relis-le avec <code>read_file()</code> dans une variable <code>texte</code>, et affiche <code>texte</code>.`,
          starter:`write_file("notes.txt", "Superbe voyage")
`,
          hints:[
            `texte = read_file("notes.txt") puis print(texte).`,
            `write_file("notes.txt", "Superbe voyage")
texte = read_file("notes.txt")
print(texte)`
          ],
          solution:`write_file("notes.txt", "Superbe voyage")
texte = read_file("notes.txt")
print(texte)`,
          checker:(r)=>outputCheck(r, ["Superbe voyage"], {fullMatch:true, failMsg:()=>'Il fallait afficher "Superbe voyage" après l\'avoir relu depuis le fichier.'})
        },
        {
          id:"pafich-2", title:"Vérifier avant de lire",
          instr:`Avant de lire le fichier <code>"journal.txt"</code> (qui n'existe pas encore), vérifie qu'il existe avec <code>file_exists()</code>. S'il existe, affiche son contenu avec <code>read_file()</code> ; sinon, affiche <code>"aucun journal pour le moment"</code>.`,
          starter:`if file_exists("journal.txt"):

else:
`,
          hints:[
            `Le if doit appeler read_file("journal.txt") et l'afficher ; le else affiche le message par défaut.`,
            `if file_exists("journal.txt"):
    print(read_file("journal.txt"))
else:
    print("aucun journal pour le moment")`
          ],
          solution:`if file_exists("journal.txt"):
    print(read_file("journal.txt"))
else:
    print("aucun journal pour le moment")`,
          checker:(r)=>outputCheck(r, ["aucun journal pour le moment"], {fullMatch:true, failMsg:()=>'Le fichier "journal.txt" n\'existe pas dans ce programme : il fallait afficher "aucun journal pour le moment".'})
        },
        {
          id:"pafich-3", title:"Ajouter une ligne au journal",
          instr:`Crée le fichier <code>"journal.txt"</code> avec <code>write_file()</code> contenant <code>"Jour 1"</code>. Relis son contenu actuel, construis un nouveau texte qui ajoute une ligne <code>"Jour 2"</code> à la suite (sépare avec <code>"\\n"</code>), réécris le fichier avec ce nouveau texte via <code>write_file()</code>, puis affiche le contenu final relu.`,
          starter:`write_file("journal.txt", "Jour 1")
`,
          hints:[
            `ancien = read_file("journal.txt") ; nouveau = ancien + "\\nJour 2" ; write_file("journal.txt", nouveau) ; puis relis et affiche.`,
            `write_file("journal.txt", "Jour 1")
ancien = read_file("journal.txt")
nouveau = ancien + "\\nJour 2"
write_file("journal.txt", nouveau)
print(read_file("journal.txt"))`
          ],
          solution:`write_file("journal.txt", "Jour 1")
ancien = read_file("journal.txt")
nouveau = ancien + "\\nJour 2"
write_file("journal.txt", nouveau)
print(read_file("journal.txt"))`,
          checker:(r)=>outputCheck(r, ["Jour 1\nJour 2"], {fullMatch:true, failMsg:()=>'Le contenu final attendu était "Jour 1" suivi d\'un retour à la ligne puis "Jour 2".'})
        }
      ]
    },
    {
      id:"pa-organiser", title:"Organiser et réutiliser son code",
      teaser:"À suivre : garder un programme qui grandit lisible, et une idée maligne pour ajouter un comportement à une fonction sans la réécrire.",
      story:"À mesure que ses programmes grandissent, CaMI apprend à les garder lisibles : des fonctions bien découpées, avec un rôle précis chacune — et une idée maligne pour ajouter un comportement à une fonction sans la réécrire.",
      intro:[
        "Un programme qui grandit devient vite difficile à suivre si tout est mélangé. La règle d'or : chaque fonction doit faire <strong>une seule chose</strong>, avec un nom qui dit clairement quoi. Plutôt qu'une fonction géante qui fait tout, on préfère plusieurs petites fonctions qui s'appellent entre elles et se réutilisent.",
        "En vrai Python, on peut aussi répartir ce code dans plusieurs fichiers (des <strong>modules</strong>) qu'on assemble avec <code>import</code> — ce mini-interpréteur ne simule pas plusieurs fichiers, mais le principe (découper, nommer, réutiliser) reste exactement le même dans un seul fichier."
      ],
      callout:"Un <strong>décorateur</strong> (<code>@quelquechose</code> en vrai Python) est une fonction qui enveloppe une autre fonction pour lui ajouter un comportement (mesurer son temps, journaliser ses appels...) sans modifier son code d'origine. Ce mini-interpréteur ne supporte pas la syntaxe <code>@</code> ni le fait de passer une fonction comme valeur, mais tu peux écrire le même principe « à la main », comme dans l'exemple ci-dessous.",
      example:{code:
`def dire_bonjour():
    print("Bonjour !")

def dire_bonjour_avec_journal():
    print("--- debut ---")
    dire_bonjour()
    print("--- fin ---")

dire_bonjour_avec_journal()`},
      exercises:[
        {
          id:"paorg-1", title:"Découper une tâche en petites fonctions",
          instr:`Écris une fonction <code>calculer_ttc(prix_ht, taux)</code> qui retourne <code>prix_ht * (1 + taux)</code>, et une fonction <code>afficher_prix(nom, prix)</code> qui affiche <code>nom + " : " + str(prix) + " euros"</code>. Utilise-les ensemble pour un produit <code>"sac a dos"</code> à <code>50</code> euros HT avec un taux de <code>0.2</code> : calcule le prix TTC dans une variable <code>total</code>, puis appelle <code>afficher_prix("sac a dos", total)</code>.`,
          starter:`def calculer_ttc(prix_ht, taux):

def afficher_prix(nom, prix):
`,
          hints:[
            `calculer_ttc retourne prix_ht * (1 + taux). afficher_prix affiche nom + " : " + str(prix) + " euros".`,
            `def calculer_ttc(prix_ht, taux):
    return prix_ht * (1 + taux)

def afficher_prix(nom, prix):
    print(nom + " : " + str(prix) + " euros")

total = calculer_ttc(50, 0.2)
afficher_prix("sac a dos", total)`
          ],
          solution:`def calculer_ttc(prix_ht, taux):
    return prix_ht * (1 + taux)

def afficher_prix(nom, prix):
    print(nom + " : " + str(prix) + " euros")

total = calculer_ttc(50, 0.2)
afficher_prix("sac a dos", total)`,
          checker:(r)=>outputCheck(r, ["sac a dos : 60 euros"], {fullMatch:true, failMsg:()=>'Il fallait afficher "sac a dos : 60 euros" (50 * 1.2).'})
        },
        {
          id:"paorg-2", title:"Le principe du décorateur, à la main",
          instr:`Écris une fonction <code>calculer(a, b)</code> qui retourne <code>a + b</code>. Puis écris une fonction <code>calculer_avec_journal(a, b)</code> qui affiche <code>"--- debut ---"</code>, appelle <code>calculer(a, b)</code> et stocke le résultat, affiche ce résultat, affiche <code>"--- fin ---"</code>, puis retourne le résultat. Appelle enfin <code>calculer_avec_journal(3, 4)</code>.`,
          starter:`def calculer(a, b):

def calculer_avec_journal(a, b):
`,
          hints:[
            `calculer_avec_journal doit imprimer avant et après avoir appelé calculer(a, b) — un vrai décorateur ferait ça automatiquement pour n'importe quelle fonction, ici on l'écrit pour celle-ci en particulier.`,
            `def calculer(a, b):
    return a + b

def calculer_avec_journal(a, b):
    print("--- debut ---")
    resultat = calculer(a, b)
    print(resultat)
    print("--- fin ---")
    return resultat

calculer_avec_journal(3, 4)`
          ],
          solution:`def calculer(a, b):
    return a + b

def calculer_avec_journal(a, b):
    print("--- debut ---")
    resultat = calculer(a, b)
    print(resultat)
    print("--- fin ---")
    return resultat

calculer_avec_journal(3, 4)`,
          checker:(r)=>outputCheck(r, ["--- debut ---","7","--- fin ---"], {fullMatch:true, failMsg:(exp)=>`Attendu : ${exp.join(", ")}.`})
        },
        {
          id:"paorg-3", title:"Réutiliser une fonction existante",
          instr:`Écris une fonction <code>est_pair(n)</code> qui retourne <code>True</code> si <code>n</code> est pair, <code>False</code> sinon. Puis écris <code>compter_pairs(nombres)</code> qui parcourt la liste et compte combien d'éléments sont pairs, <strong>en réutilisant <code>est_pair()</code></strong> plutôt qu'en recopiant le test. Affiche <code>compter_pairs([1, 2, 3, 4, 5, 6])</code>.`,
          starter:`def est_pair(n):

def compter_pairs(nombres):
`,
          hints:[
            `Dans compter_pairs, utilise un compteur qui augmente de 1 à chaque fois que est_pair(n) est vrai.`,
            `def est_pair(n):
    return n % 2 == 0

def compter_pairs(nombres):
    total = 0
    for n in nombres:
        if est_pair(n):
            total += 1
    return total

print(compter_pairs([1, 2, 3, 4, 5, 6]))`
          ],
          solution:`def est_pair(n):
    return n % 2 == 0

def compter_pairs(nombres):
    total = 0
    for n in nombres:
        if est_pair(n):
            total += 1
    return total

print(compter_pairs([1, 2, 3, 4, 5, 6]))`,
          checker:(r)=>outputCheck(r, ["3"], {fullMatch:true, failMsg:()=>"Dans [1,2,3,4,5,6], il y a 3 nombres pairs (2, 4, 6)."})
        }
      ]
    },
    {
      id:"pa-projet", title:"Projet : le carnet de voyage nouvelle génération",
      teaser:"Pour finir cette partie : un projet qui rassemble classes, compréhensions, *args et fichiers pour gérer toute une équipe de voyageurs.",
      story:"CaMI a acquis de nouveaux outils : classes, compréhensions, *args, fichiers. Dernier projet de cette partie : les rassembler pour gérer une équipe de voyageurs, leur budget, et sauvegarder un résumé.",
      intro:[
        "Ce chapitre n'introduit aucune nouvelle notion : c'est l'occasion de combiner ce que tu as appris dans cette partie — <strong>classes</strong>, <strong>compréhensions</strong>, <strong>*args</strong> et <strong>fichiers</strong> — dans un projet un peu plus ambitieux.",
        "Chaque étape s'appuie sur les précédentes. Si tu bloques, relis le chapitre correspondant à la notion utilisée : rien de nouveau n'est demandé ici."
      ],
      callout:"Un projet, c'est juste plusieurs briques que tu connais déjà, assemblées ensemble. Prends ton temps sur chaque étape.",
      example:{code:
`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

v = Voyageur("Aria", 300)
print(v.nom + " : " + str(v.budget) + " euros")`},
      exercises:[
        {
          id:"paproj-1", title:"Étape 1 — La classe Voyageur",
          instr:`Crée une classe <code>Voyageur</code> avec <code>__init__(self, nom, budget)</code>, et une méthode <code>depenser(self, montant)</code> qui retire <code>montant</code> à <code>self.budget</code>. Crée <code>v = Voyageur("Leo", 200)</code>, appelle <code>v.depenser(50)</code>, puis affiche <code>v.budget</code>.`,
          starter:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget
`,
          hints:[
            `depenser doit faire self.budget -= montant.`,
            `class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget
    def depenser(self, montant):
        self.budget -= montant

v = Voyageur("Leo", 200)
v.depenser(50)
print(v.budget)`
          ],
          solution:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget
    def depenser(self, montant):
        self.budget -= montant

v = Voyageur("Leo", 200)
v.depenser(50)
print(v.budget)`,
          checker:(r)=>outputCheck(r, ["150"], {fullMatch:true, failMsg:()=>"200 - 50 = 150."})
        },
        {
          id:"paproj-2", title:"Étape 2 — Qui a encore du budget ?",
          instr:`La classe <code>Voyageur</code> (avec <code>nom</code> et <code>budget</code>) est prête. Crée trois voyageurs : <code>Voyageur("Aria", 250)</code>, <code>Voyageur("Leo", 80)</code>, <code>Voyageur("Mia", 150)</code>, range-les dans une liste <code>equipe</code>. Par compréhension, construis <code>solvables</code> : les noms des voyageurs dont le budget est <code>&gt;= 100</code>. Affiche <code>solvables</code>.`,
          starter:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
`,
          hints:[
            `solvables = [v.nom for v in equipe if v.budget >= 100]`,
            `class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
solvables = [v.nom for v in equipe if v.budget >= 100]
print(solvables)`
          ],
          solution:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
solvables = [v.nom for v in equipe if v.budget >= 100]
print(solvables)`,
          checker:(r)=>oracleCheck(r, ()=>["Aria","Mia"], {singleValue:true, fmt: AlgoEngine.fmt,
            failMsg:(exp)=>`La liste attendue était ${exp[0]}.`})
        },
        {
          id:"paproj-3", title:"Étape 3 — Le budget total de l'équipe",
          instr:`Écris une fonction <code>budget_total(*voyageurs)</code> qui retourne la somme des <code>.budget</code> de chaque voyageur reçu en argument. Teste-la avec <code>print(budget_total(Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)))</code>.`,
          starter:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

def budget_total(*voyageurs):
`,
          hints:[
            `Parcours voyageurs avec une boucle for, additionne v.budget à un total, puis retourne total.`,
            `class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

def budget_total(*voyageurs):
    total = 0
    for v in voyageurs:
        total += v.budget
    return total

print(budget_total(Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)))`
          ],
          solution:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

def budget_total(*voyageurs):
    total = 0
    for v in voyageurs:
        total += v.budget
    return total

print(budget_total(Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)))`,
          checker:(r)=>outputCheck(r, ["480"], {fullMatch:true, failMsg:()=>"250 + 80 + 150 = 480."})
        },
        {
          id:"paproj-4", title:"Étape 4 — Sauvegarder le résumé",
          instr:`Reprends <code>equipe</code> (les trois voyageurs Aria 250, Leo 80, Mia 150). Par compréhension, construis <code>lignes</code> : une liste de chaînes <code>"nom : budget euros"</code>, une par voyageur. Assemble-les avec <code>"\\n".join(lignes)</code> dans <code>resume</code>. Sauvegarde <code>resume</code> avec <code>write_file("resume.txt", resume)</code>, puis relis et affiche le fichier avec <code>read_file()</code>.`,
          starter:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
`,
          hints:[
            `lignes = [v.nom + " : " + str(v.budget) + " euros" for v in equipe], puis resume = "\\n".join(lignes).`,
            `class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
lignes = [v.nom + " : " + str(v.budget) + " euros" for v in equipe]
resume = "\\n".join(lignes)
write_file("resume.txt", resume)
print(read_file("resume.txt"))`
          ],
          solution:`class Voyageur:
    def __init__(self, nom, budget):
        self.nom = nom
        self.budget = budget

equipe = [Voyageur("Aria", 250), Voyageur("Leo", 80), Voyageur("Mia", 150)]
lignes = [v.nom + " : " + str(v.budget) + " euros" for v in equipe]
resume = "\\n".join(lignes)
write_file("resume.txt", resume)
print(read_file("resume.txt"))`,
          checker:(r)=>outputCheck(r, ["Aria : 250 euros\nLeo : 80 euros\nMia : 150 euros"], {fullMatch:true, failMsg:()=>'Le résumé attendu, une ligne par voyageur séparée par un retour à la ligne : "Aria : 250 euros / Leo : 80 euros / Mia : 150 euros".'})
        }
      ]
    }
  ]
},
ia: {
  id:"ia", label:"Partie 4", shortLabel:"IA", langTag:"intelligence artificielle",
  run:(src)=>AlgoEngine.runPython(src),
  chapters:[
    {
      id:"ia-intro", title:"Introduction à l'intelligence artificielle",
      teaser:"Après le voyage : un nouveau chantier pour CaMI — rendre son appli un peu plus intelligente.",
      story:"De retour de voyage, CaMI a une nouvelle idée : rendre son appli plus « intelligente ». Avant de foncer, un peu de théorie s'impose — c'est quoi, une intelligence artificielle ?",
      intro:[
        "Une <strong>intelligence artificielle</strong> (IA), dans son sens le plus large, est un programme qui prend des décisions ou fait des prédictions à partir de données. Il existe deux grandes familles : les IA <strong>à base de règles</strong> (tu écris toi-même les conditions, comme un gros <code>if</code>/<code>elif</code>), et les IA qui <strong>apprennent</strong> à partir d'exemples (on lui montre des données, et elle ajuste elle-même ses paramètres).",
        "Dans les prochains chapitres, tu vas coder les deux : d'abord un agent à règles (un petit chatbot), puis des programmes qui « apprennent » — un classifieur, un neurone artificiel, une régression. Rien de magique : ce sont des additions, des comparaisons et des boucles, organisées intelligemment."
      ],
      callout:"Une IA n'est jamais meilleure que les données et les règles qu'on lui donne. Un modèle entraîné sur des exemples biaisés reproduira ce biais — un vrai sujet, qu'on retrouvera à la fin de cette partie.",
      example:{code:
`def conseiller_tenue(temperature):
    if temperature < 10:
        return "gros manteau"
    if temperature < 20:
        return "veste"
    return "t-shirt"

print(conseiller_tenue(5))
print(conseiller_tenue(25))`},
      exercises:[
        {
          id:"iaintro-1", title:"Une première IA à base de règles",
          instr:`Écris une fonction <code>predire_activite(meteo)</code> qui retourne <code>"randonnee"</code> si <code>meteo == "ensoleille"</code>, <code>"musee"</code> si <code>meteo == "pluie"</code>, et <code>"a decider"</code> pour tout autre cas.`,
          starter:`def predire_activite(meteo):
`,
          hints:[
            `Un enchaînement if / elif / else suffit — pas besoin d'apprentissage pour ce genre de règle simple.`,
            `def predire_activite(meteo):
    if meteo == "ensoleille":
        return "randonnee"
    elif meteo == "pluie":
        return "musee"
    else:
        return "a decider"`
          ],
          solution:`def predire_activite(meteo):
    if meteo == "ensoleille":
        return "randonnee"
    elif meteo == "pluie":
        return "musee"
    else:
        return "a decider"`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(predire_activite("ensoleille"))
print(predire_activite("pluie"))
print(predire_activite("nuageux"))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["randonnee","musee","a decider"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur 3 météos, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"iaintro-2", title:"Un mini-modèle sous forme de dictionnaire",
          instr:`Un "modèle" très simple peut être un dictionnaire d'exemples déjà connus. Écris <code>predire_sentiment(mot, sentiments)</code> qui retourne <code>sentiments.get(mot, "inconnu")</code> (le dictionnaire est passé en paramètre, car ici une fonction ne voit pas les variables créées en dehors d'elle).`,
          starter:`def predire_sentiment(mot, sentiments):
`,
          hints:[
            `sentiments.get(mot, "inconnu") retourne directement la bonne valeur, avec un défaut si le mot est absent.`,
            `def predire_sentiment(mot, sentiments):
    return sentiments.get(mot, "inconnu")`
          ],
          solution:`def predire_sentiment(mot, sentiments):
    return sentiments.get(mot, "inconnu")`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
sentiments = {"super": "positif", "nul": "negatif", "sympa": "positif", "horrible": "negatif"}
print(predire_sentiment("super", sentiments))
print(predire_sentiment("horrible", sentiments))
print(predire_sentiment("banane", sentiments))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["positif","negatif","inconnu"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur 3 mots, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"iaintro-3", title:"Les limites d'une règle trop simple",
          instr:`Écris <code>predire_meteo(mots_cles)</code> qui retourne <code>"il pleut"</code> si <code>"nuages"</code> est dans la liste <code>mots_cles</code>, sinon <code>"beau temps"</code>. Teste avec <code>["nuages", "vent"]</code> — une prédiction bien fragile : un seul mot-clé suffit à tout faire basculer.`,
          starter:`def predire_meteo(mots_cles):
`,
          hints:[
            `Utilise l'opérateur in pour tester la présence de "nuages" dans la liste.`,
            `def predire_meteo(mots_cles):
    if "nuages" in mots_cles:
        return "il pleut"
    else:
        return "beau temps"`
          ],
          solution:`def predire_meteo(mots_cles):
    if "nuages" in mots_cles:
        return "il pleut"
    else:
        return "beau temps"`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(predire_meteo(["nuages", "vent"]))
print(predire_meteo(["soleil", "chaleur"]))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["il pleut","beau temps"];
            const tail=res.output.slice(res.output.length-2);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça ! (et tu vois bien la limite : un seul mot-clé décide de tout)"};
            return {pass:false, message:`Testée sur 2 cas, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        }
      ]
    },
    {
      id:"ia-chatbot", title:"Un agent à règles : le chatbot à mots-clés",
      teaser:"Premier vrai projet d'IA : un petit chatbot capable de répondre selon les mots employés.",
      story:"Premier vrai projet d'IA pour CaMI : un petit chatbot capable de répondre selon les mots employés — sans aucun apprentissage, juste des règles bien construites.",
      intro:[
        "Un <strong>chatbot à mots-clés</strong> est une IA à base de règles : il cherche certains mots dans le message reçu, et répond en conséquence. Pas d'apprentissage ici — seulement de la détection de motifs, avec les outils que tu maîtrises déjà : dictionnaires, chaînes de caractères, boucles.",
        "La méthode <code>.lower()</code> est essentielle : elle met tout en minuscules, pour que <code>\"Bonjour\"</code> et <code>\"bonjour\"</code> soient traités pareil."
      ],
      callout:"Un vrai assistant conversationnel comprend un langage bien plus riche grâce à l'apprentissage sur d'énormes quantités de texte. Un chatbot à mots-clés est une version volontairement simplifiée, pour comprendre le principe de base : détecter un motif, répondre en conséquence.",
      example:{code:
`def repondre(message):
    msg = message.lower()
    if "bonjour" in msg:
        return "Salut ! Comment puis-je t'aider ?"
    if "merci" in msg:
        return "Avec plaisir !"
    return "Je ne comprends pas encore ce message."

print(repondre("Bonjour toi !"))
print(repondre("Merci beaucoup"))`},
      exercises:[
        {
          id:"iachat-1", title:"Trois règles simples",
          instr:`Écris <code>repondre(message)</code> qui met <code>message</code> en minuscules dans une variable <code>msg</code>, puis retourne <code>"Au revoir !"</code> si <code>"au revoir"</code> est dans <code>msg</code>, <code>"Je vais bien, merci !"</code> si <code>"ca va"</code> est dans <code>msg</code>, et <code>"..."</code> sinon.`,
          starter:`def repondre(message):
`,
          hints:[
            `N'oublie pas msg = message.lower() en premier, puis teste "au revoir" in msg, puis "ca va" in msg.`,
            `def repondre(message):
    msg = message.lower()
    if "au revoir" in msg:
        return "Au revoir !"
    if "ca va" in msg:
        return "Je vais bien, merci !"
    return "..."`
          ],
          solution:`def repondre(message):
    msg = message.lower()
    if "au revoir" in msg:
        return "Au revoir !"
    if "ca va" in msg:
        return "Je vais bien, merci !"
    return "..."`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(repondre("Au revoir tout le monde"))
print(repondre("Ca va toi ?"))
print(repondre("blabla"))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["Au revoir !","Je vais bien, merci !","..."];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testé sur 3 messages, attendu ${expected.join(", ")}.`};
          }
        },
        {
          id:"iachat-2", title:"Un dictionnaire de règles",
          instr:`Plutôt que d'enchaîner les <code>if</code>, utilise un dictionnaire de règles. Écris <code>repondre(message, regles)</code> qui parcourt <code>regles</code> avec <code>for mot_cle in regles:</code>, et retourne <code>regles[mot_cle]</code> dès qu'un <code>mot_cle</code> est trouvé dans <code>message.lower()</code> — ou <code>"Je ne comprends pas."</code> si aucun ne correspond. (Le dictionnaire est passé en paramètre, car une fonction ne voit pas les variables créées en dehors d'elle.)`,
          starter:`def repondre(message, regles):
`,
          hints:[
            `Parcours regles avec for mot_cle in regles:, teste if mot_cle in message.lower(): puis return regles[mot_cle]. Si la boucle se termine sans avoir trouvé, retourne le message par défaut après elle.`,
            `def repondre(message, regles):
    msg = message.lower()
    for mot_cle in regles:
        if mot_cle in msg:
            return regles[mot_cle]
    return "Je ne comprends pas."`
          ],
          solution:`def repondre(message, regles):
    msg = message.lower()
    for mot_cle in regles:
        if mot_cle in msg:
            return regles[mot_cle]
    return "Je ne comprends pas."`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
regles = {"bonjour": "Salut !", "merci": "Avec plaisir !", "aide": "Je suis la pour toi."}
print(repondre("Bonjour !", regles))
print(repondre("Un peu d aide stp", regles))
print(repondre("xyz", regles))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["Salut !","Je suis la pour toi.","Je ne comprends pas."];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testé sur 3 messages, attendu ${expected.join(", ")}.`};
          }
        },
        {
          id:"iachat-3", title:"Une petite conversation",
          instr:`La fonction <code>repondre(message, regles)</code> et le dictionnaire de règles du chapitre sont donnés. La liste <code>messages = ["Bonjour !", "Un peu d aide stp", "bzzzzz"]</code> simule une conversation. Parcours-la et affiche la réponse du chatbot à chaque message avec une boucle <code>for</code>.`,
          starter:`def repondre(message, regles):
    msg = message.lower()
    for mot_cle in regles:
        if mot_cle in msg:
            return regles[mot_cle]
    return "Je ne comprends pas."

regles = {"bonjour": "Salut !", "merci": "Avec plaisir !", "aide": "Je suis la pour toi."}
messages = ["Bonjour !", "Un peu d aide stp", "bzzzzz"]
`,
          hints:[
            `for message in messages: print(repondre(message, regles))`,
            `def repondre(message, regles):
    msg = message.lower()
    for mot_cle in regles:
        if mot_cle in msg:
            return regles[mot_cle]
    return "Je ne comprends pas."

regles = {"bonjour": "Salut !", "merci": "Avec plaisir !", "aide": "Je suis la pour toi."}
messages = ["Bonjour !", "Un peu d aide stp", "bzzzzz"]
for message in messages:
    print(repondre(message, regles))`
          ],
          solution:`def repondre(message, regles):
    msg = message.lower()
    for mot_cle in regles:
        if mot_cle in msg:
            return regles[mot_cle]
    return "Je ne comprends pas."

regles = {"bonjour": "Salut !", "merci": "Avec plaisir !", "aide": "Je suis la pour toi."}
messages = ["Bonjour !", "Un peu d aide stp", "bzzzzz"]
for message in messages:
    print(repondre(message, regles))`,
          checker:(r)=>outputCheck(r, ["Salut !","Je suis la pour toi.","Je ne comprends pas."], {fullMatch:true, failMsg:(exp)=>`Attendu : ${exp.join(", ")}.`})
        }
      ]
    },
    {
      id:"ia-classification", title:"Apprentissage supervisé : classer à la main",
      teaser:"À suivre : reconnaître automatiquement des catégories, en s'appuyant sur des exemples déjà classés plutôt que des règles écrites à la main.",
      story:"CaMI veut que son appli reconnaisse automatiquement des catégories — pas avec des règles écrites à la main, mais en s'appuyant sur des exemples déjà classés. Bienvenue dans l'apprentissage supervisé.",
      intro:[
        "En <strong>apprentissage supervisé</strong>, on donne au programme des exemples déjà étiquetés (le poids d'un fruit → \"petit\" ou \"grand\", par exemple), et il apprend à prédire l'étiquette d'un nouvel exemple jamais vu, en se basant sur ce qu'il a observé.",
        "Une des méthodes les plus simples s'appelle le <strong>plus proche voisin</strong> : pour classer une nouvelle valeur, on regarde quel exemple connu lui ressemble le plus (la distance la plus petite), et on lui donne la même étiquette."
      ],
      callout:"Pas de formule magique ici : « apprendre », pour cet algorithme, veut simplement dire garder les exemples en mémoire et comparer. D'autres techniques d'IA ajustent réellement des paramètres internes — tu en coderas une au prochain chapitre.",
      example:{code:
`exemples = [[120, "petit"], [300, "grand"]]
nouveau_poids = 140

meilleure_distance = abs(exemples[0][0] - nouveau_poids)
meilleure_categorie = exemples[0][1]
for ex in exemples:
    d = abs(ex[0] - nouveau_poids)
    if d < meilleure_distance:
        meilleure_distance = d
        meilleure_categorie = ex[1]

print(meilleure_categorie)`},
      exercises:[
        {
          id:"iaclass-1", title:"Mesurer une distance",
          instr:`Écris une fonction <code>distance(a, b)</code> qui retourne la distance entre deux nombres, c'est-à-dire la valeur absolue de leur différence (<code>abs(a - b)</code>). C'est la brique de base de tout classifieur par plus proche voisin.`,
          starter:`def distance(a, b):
`,
          hints:[
            `Une seule ligne suffit : return abs(a - b).`,
            `def distance(a, b):
    return abs(a - b)`
          ],
          solution:`def distance(a, b):
    return abs(a - b)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(distance(10, 3))
print(distance(3, 10))
print(distance(-5, 5))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["7","7","10"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs paires, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"iaclass-2", title:"Le plus proche voisin",
          instr:`La fonction <code>distance(a, b)</code> est prête. Écris <code>classer(poids, exemples)</code> qui parcourt <code>exemples</code> (une liste <code>[poids, categorie]</code>), trouve celui dont le poids est le plus proche de <code>poids</code> (grâce à <code>distance()</code>), et retourne sa catégorie. (<code>exemples</code> est passé en paramètre, car une fonction ne voit pas les variables créées en dehors d'elle.)`,
          starter:`def distance(a, b):
    return abs(a - b)

def classer(poids, exemples):
`,
          hints:[
            `Garde en mémoire la meilleure distance trouvée jusqu'ici (initialisée avec le premier exemple), et mets-la à jour à chaque exemple plus proche.`,
            `def distance(a, b):
    return abs(a - b)

def classer(poids, exemples):
    meilleure_distance = distance(exemples[0][0], poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = distance(ex[0], poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie`
          ],
          solution:`def distance(a, b):
    return abs(a - b)

def classer(poids, exemples):
    meilleure_distance = distance(exemples[0][0], poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = distance(ex[0], poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
exemples = [[120, "petit"], [300, "grand"], [180, "petit"], [350, "grand"]]
print(classer(140, exemples))
print(classer(320, exemples))
print(classer(190, exemples))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["petit","grand","petit"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça ! Ton premier classifieur fonctionne."};
            return {pass:false, message:`Testé sur plusieurs poids, attendu ${expected.join(", ")}.`};
          }
        },
        {
          id:"iaclass-3", title:"Mesurer la précision",
          instr:`Reprends <code>classer(poids, exemples)</code>. Le jeu de test <code>tests = [[130, "petit"], [320, "grand"], [340, "grand"], [100, "petit"]]</code> contient des poids déjà étiquetés. Compte combien de prédictions de <code>classer()</code> correspondent à l'étiquette réelle, puis affiche la précision en pourcentage : <code>corrects / len(tests) * 100</code>.`,
          starter:`def distance(a, b):
    return abs(a - b)

def classer(poids, exemples):
    meilleure_distance = distance(exemples[0][0], poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = distance(ex[0], poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

exemples = [[120, "petit"], [300, "grand"], [180, "petit"], [350, "grand"]]
tests = [[130, "petit"], [320, "grand"], [340, "grand"], [100, "petit"]]
`,
          hints:[
            `Parcours tests, compare classer(t[0], exemples) à t[1] (la vraie catégorie), et compte les correspondances dans un compteur corrects.`,
            `tests = [[130, "petit"], [320, "grand"], [340, "grand"], [100, "petit"]]
corrects = 0
for t in tests:
    if classer(t[0], exemples) == t[1]:
        corrects += 1
print(corrects / len(tests) * 100)`
          ],
          solution:`def distance(a, b):
    return abs(a - b)

def classer(poids, exemples):
    meilleure_distance = distance(exemples[0][0], poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = distance(ex[0], poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

exemples = [[120, "petit"], [300, "grand"], [180, "petit"], [350, "grand"]]
tests = [[130, "petit"], [320, "grand"], [340, "grand"], [100, "petit"]]
corrects = 0
for t in tests:
    if classer(t[0], exemples) == t[1]:
        corrects += 1
print(corrects / len(tests) * 100)`,
          checker:(r)=>outputCheck(r, ["100"], {fullMatch:true, failMsg:()=>"Les 4 exemples de test sont bien classés par ce classifieur : la précision attendue était 100."})
        }
      ]
    },
    {
      id:"ia-neurone", title:"Un neurone artificiel : le perceptron",
      teaser:"Prochaine étape : coder un vrai petit bout de réseau de neurones, capable d'apprendre en ajustant ses propres réglages.",
      story:"CaMI a entendu parler de « réseaux de neurones ». Avant de rêver trop grand, elle commence par le tout premier brique : un seul neurone artificiel, et sa façon d'apprendre.",
      intro:[
        "Un <strong>neurone artificiel</strong> reçoit plusieurs entrées, chacune multipliée par un <strong>poids</strong> (son importance), additionne le tout avec un <strong>biais</strong>, puis applique une <strong>fonction d'activation</strong> pour décider de sa sortie. Ici, on utilise la plus simple : une fonction « en escalier » qui répond <code>1</code> si la somme est positive ou nulle, <code>0</code> sinon.",
        "Ce qui rend le neurone capable d'« apprendre », c'est la <strong>règle d'apprentissage du perceptron</strong> : à chaque exemple, on compare sa prédiction à la bonne réponse, et on ajuste légèrement les poids et le biais dans la bonne direction. Répétée sur plusieurs exemples et plusieurs passages (des <em>époques</em>), cette petite correction suffit à faire converger le neurone vers les bons réglages."
      ],
      callout:"C'est exactement ce principe — ajuster des poids en fonction de l'erreur, encore et encore — qui est au cœur des réseaux de neurones modernes, juste répété des milliards de fois sur des neurones bien plus nombreux.",
      example:{code:
`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

entrees = [1, 0.5]
poids = [0.6, 0.2]
biais = -0.3
print(activation(somme_ponderee(entrees, poids) + biais))`},
      exercises:[
        {
          id:"ianeur-1", title:"La somme pondérée",
          instr:`Écris <code>somme_ponderee(entrees, poids)</code> qui retourne la somme de chaque entrée multipliée par son poids correspondant (<code>entrees[i] * poids[i]</code>, additionnés pour tous les <code>i</code>). Utilise une boucle <code>for i in range(len(entrees)):</code>.`,
          starter:`def somme_ponderee(entrees, poids):
`,
          hints:[
            `Un accumulateur total = 0, puis total += entrees[i] * poids[i] à chaque tour.`,
            `def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total`
          ],
          solution:`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(somme_ponderee([1, 2], [3, 4]))
print(somme_ponderee([0, 0], [5, 5]))
print(somme_ponderee([2, 3, 1], [1, 1, 1]))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["11","0","6"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs cas, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"ianeur-2", title:"La fonction d'activation",
          instr:`Écris <code>activation(x)</code> qui retourne <code>1</code> si <code>x >= 0</code>, sinon <code>0</code>. Puis écris <code>neurone(entrees, poids, biais)</code> qui retourne <code>activation(somme_ponderee(entrees, poids) + biais)</code> (utilise la fonction <code>somme_ponderee</code> déjà écrite).`,
          starter:`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):

def neurone(entrees, poids, biais):
`,
          hints:[
            `activation(x) est un simple if/else à une ligne chacun. neurone appelle les deux autres fonctions déjà écrites.`,
            `def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

def neurone(entrees, poids, biais):
    return activation(somme_ponderee(entrees, poids) + biais)`
          ],
          solution:`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

def neurone(entrees, poids, biais):
    return activation(somme_ponderee(entrees, poids) + biais)`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
print(neurone([0, 0], [1, 1], -0.5))
print(neurone([1, 0], [1, 1], -0.5))
print(neurone([1, 1], [1, 1], -0.5))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["0","1","1"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça ! Ce neurone reproduit une porte logique OU."};
            return {pass:false, message:`Testé sur 3 cas, attendu ${expected.join(", ")}.`};
          }
        },
        {
          id:"ianeur-3", title:"Entraîner le neurone (porte ET)",
          instr:`Les fonctions <code>somme_ponderee</code>, <code>activation</code> et <code>neurone</code> sont prêtes, ainsi que les données d'entraînement pour la porte logique ET. Complète la boucle d'entraînement : pour chaque exemple <code>i</code>, calcule <code>prediction = neurone(entrees_entrainement[i], poids, biais)</code>, puis <code>erreur = sorties_attendues[i] - prediction</code>. Applique la règle d'apprentissage du perceptron : <code>poids[0] = poids[0] + taux * erreur * entrees_entrainement[i][0]</code> (pareil pour <code>poids[1]</code>), et <code>biais = biais + taux * erreur</code>. Après les époques, affiche <code>neurone(...)</code> pour chacune des 4 entrées d'entraînement, une par ligne.`,
          starter:`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

def neurone(entrees, poids, biais):
    return activation(somme_ponderee(entrees, poids) + biais)

entrees_entrainement = [[0, 0], [0, 1], [1, 0], [1, 1]]
sorties_attendues = [0, 0, 0, 1]
poids = [0, 0]
biais = 0
taux = 0.1

for epoque in range(20):
    for i in range(len(entrees_entrainement)):
`,
          hints:[
            `Dans la boucle intérieure : calcule prediction et erreur, puis mets à jour poids[0], poids[1] et biais avec la règle donnée dans la consigne.`,
            `def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

def neurone(entrees, poids, biais):
    return activation(somme_ponderee(entrees, poids) + biais)

entrees_entrainement = [[0, 0], [0, 1], [1, 0], [1, 1]]
sorties_attendues = [0, 0, 0, 1]
poids = [0, 0]
biais = 0
taux = 0.1

for epoque in range(20):
    for i in range(len(entrees_entrainement)):
        prediction = neurone(entrees_entrainement[i], poids, biais)
        erreur = sorties_attendues[i] - prediction
        poids[0] = poids[0] + taux * erreur * entrees_entrainement[i][0]
        poids[1] = poids[1] + taux * erreur * entrees_entrainement[i][1]
        biais = biais + taux * erreur

for entree in entrees_entrainement:
    print(neurone(entree, poids, biais))`
          ],
          solution:`def somme_ponderee(entrees, poids):
    total = 0
    for i in range(len(entrees)):
        total += entrees[i] * poids[i]
    return total

def activation(x):
    if x >= 0:
        return 1
    return 0

def neurone(entrees, poids, biais):
    return activation(somme_ponderee(entrees, poids) + biais)

entrees_entrainement = [[0, 0], [0, 1], [1, 0], [1, 1]]
sorties_attendues = [0, 0, 0, 1]
poids = [0, 0]
biais = 0
taux = 0.1

for epoque in range(20):
    for i in range(len(entrees_entrainement)):
        prediction = neurone(entrees_entrainement[i], poids, biais)
        erreur = sorties_attendues[i] - prediction
        poids[0] = poids[0] + taux * erreur * entrees_entrainement[i][0]
        poids[1] = poids[1] + taux * erreur * entrees_entrainement[i][1]
        biais = biais + taux * erreur

for entree in entrees_entrainement:
    print(neurone(entree, poids, biais))`,
          checker:(r)=>outputCheck(r, ["0","0","0","1"], {fullMatch:true, failMsg:(exp)=>`Après entraînement, le neurone devait reproduire la porte ET : ${exp.join(", ")}.`})
        }
      ]
    },
    {
      id:"ia-regression", title:"Entraîner un modèle par tâtonnement",
      teaser:"Ensuite : trouver automatiquement la meilleure droite pour décrire un jeu de données, en testant plusieurs réglages.",
      story:"CaMI veut prédire une valeur à partir d'une autre (le score selon les heures de révision, par exemple) avec une droite. Reste à trouver la MEILLEURE droite — sans la deviner, en la faisant chercher par le programme.",
      intro:[
        "Une <strong>régression linéaire</strong> cherche la droite <code>y = a * x + b</code> qui décrit le mieux un ensemble de points. Pour savoir si une droite est bonne, on mesure son <strong>erreur</strong> : pour chaque point, l'écart entre la valeur prédite et la vraie valeur, mis au carré (pour que les écarts positifs et négatifs comptent pareil), puis additionné sur tous les points.",
        "Plutôt que de résoudre une formule mathématique compliquée, on peut <strong>tâtonner</strong> : tester plusieurs valeurs candidates pour <code>a</code> et <code>b</code>, calculer l'erreur de chacune, et garder la meilleure. C'est une version très simplifiée de ce qui se passe réellement quand un modèle « s'entraîne »."
      ],
      callout:"De vrais algorithmes d'entraînement (comme la « descente de gradient ») sont plus malins qu'un tâtonnement au hasard — mais l'idée de fond est la même : essayer, mesurer l'erreur, ajuster, recommencer.",
      example:{code:
`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total

donnees = [[1, 3], [2, 5], [3, 7]]
print(erreur_totale(2, 1, donnees))
print(erreur_totale(1, 1, donnees))`},
      exercises:[
        {
          id:"iareg-1", title:"Mesurer l'erreur d'une droite",
          instr:`Écris <code>erreur_totale(a, b, donnees)</code> : pour chaque <code>point</code> de <code>donnees</code> (une liste <code>[x, y]</code>), calcule <code>prediction = a * x + b</code>, puis additionne <code>(prediction - y) ** 2</code> à un total. Retourne ce total.`,
          starter:`def erreur_totale(a, b, donnees):
`,
          hints:[
            `total = 0, puis pour chaque point : x = point[0], y = point[1], prediction = a * x + b, total += (prediction - y) ** 2.`,
            `def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total`
          ],
          solution:`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total`,
          checker:(r,studentCode)=>{
            const full = studentCode + `
donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]
print(erreur_totale(2, 1, donnees))
print(erreur_totale(1, 1, donnees))
print(erreur_totale(3, 0, donnees))
`;
            const res = AlgoEngine.runPython(full);
            if(!res.success) return {pass:false, message:"Il y a une erreur dans le code : "+res.error.message};
            const expected=["0","30","14"];
            const tail=res.output.slice(res.output.length-3);
            if(JSON.stringify(tail)===JSON.stringify(expected)) return {pass:true, message:"Bravo, c'est exactement ça !"};
            return {pass:false, message:`Testée sur plusieurs droites, la fonction devait renvoyer ${expected.join(", ")}.`};
          }
        },
        {
          id:"iareg-2", title:"Chercher la meilleure pente",
          instr:`Avec <code>donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]</code> et <code>b</code> fixé à <code>1</code>, teste chaque valeur de <code>candidats_a = [0, 1, 2, 3, 4]</code> avec <code>erreur_totale(a, 1, donnees)</code>, garde celle qui donne l'erreur la plus petite dans <code>meilleur_a</code>, puis affiche <code>meilleur_a</code>.`,
          starter:`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total

donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]
candidats_a = [0, 1, 2, 3, 4]
`,
          hints:[
            `Initialise meilleur_a et meilleure_erreur avec le premier candidat, puis compare à chaque tour de boucle.`,
            `meilleur_a = candidats_a[0]
meilleure_erreur = erreur_totale(candidats_a[0], 1, donnees)
for a in candidats_a:
    e = erreur_totale(a, 1, donnees)
    if e < meilleure_erreur:
        meilleure_erreur = e
        meilleur_a = a
print(meilleur_a)`
          ],
          solution:`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total

donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]
candidats_a = [0, 1, 2, 3, 4]
meilleur_a = candidats_a[0]
meilleure_erreur = erreur_totale(candidats_a[0], 1, donnees)
for a in candidats_a:
    e = erreur_totale(a, 1, donnees)
    if e < meilleure_erreur:
        meilleure_erreur = e
        meilleur_a = a
print(meilleur_a)`,
          checker:(r)=>outputCheck(r, ["2"], {fullMatch:true, failMsg:()=>"La droite y = 2x + 1 passe exactement par tous les points (erreur 0) : meilleur_a devait être 2."})
        },
        {
          id:"iareg-3", title:"Chercher a et b ensemble",
          instr:`Toujours avec <code>donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]</code>, teste maintenant toutes les combinaisons de <code>candidats_a = [0, 1, 2, 3]</code> et <code>candidats_b = [0, 1, 2]</code> (deux boucles <code>for</code> imbriquées), garde celle qui minimise <code>erreur_totale</code>, puis affiche <code>meilleur_a</code> puis <code>meilleur_b</code>.`,
          starter:`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total

donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]
candidats_a = [0, 1, 2, 3]
candidats_b = [0, 1, 2]
meilleur_a = candidats_a[0]
meilleur_b = candidats_b[0]
meilleure_erreur = erreur_totale(candidats_a[0], candidats_b[0], donnees)

`,
          hints:[
            `Deux boucles for imbriquées : for a in candidats_a: for b in candidats_b: ... — compare l'erreur à chaque combinaison.`,
            `for a in candidats_a:
    for b in candidats_b:
        e = erreur_totale(a, b, donnees)
        if e < meilleure_erreur:
            meilleure_erreur = e
            meilleur_a = a
            meilleur_b = b
print(meilleur_a)
print(meilleur_b)`
          ],
          solution:`def erreur_totale(a, b, donnees):
    total = 0
    for point in donnees:
        x = point[0]
        y = point[1]
        prediction = a * x + b
        total += (prediction - y) ** 2
    return total

donnees = [[1, 3], [2, 5], [3, 7], [4, 9]]
candidats_a = [0, 1, 2, 3]
candidats_b = [0, 1, 2]
meilleur_a = candidats_a[0]
meilleur_b = candidats_b[0]
meilleure_erreur = erreur_totale(candidats_a[0], candidats_b[0], donnees)

for a in candidats_a:
    for b in candidats_b:
        e = erreur_totale(a, b, donnees)
        if e < meilleure_erreur:
            meilleure_erreur = e
            meilleur_a = a
            meilleur_b = b
print(meilleur_a)
print(meilleur_b)`,
          checker:(r)=>outputCheck(r, ["2","1"], {fullMatch:true, failMsg:()=>"La droite y = 2x + 1 est la seule à erreur 0 parmi ces candidats : meilleur_a=2, meilleur_b=1."})
        }
      ]
    },
    {
      id:"ia-projet", title:"Projet final : le mini-assistant intelligent de CaMI",
      story:"Dernière étape du parcours : CaMI rassemble tout ce qu'elle a appris — classes, dictionnaires, règles, classification — pour construire un assistant qui répond ET qui classe.",
      intro:[
        "Ce chapitre n'introduit aucune nouvelle notion : c'est l'occasion de combiner <strong>classes</strong>, <strong>dictionnaires</strong>, un <strong>chatbot à règles</strong> et un <strong>classifieur</strong> dans un dernier projet, pour clore le parcours.",
        "Chaque étape s'appuie sur les précédentes. Si tu bloques, relis le chapitre correspondant : rien de nouveau n'est demandé ici."
      ],
      callout:"Un projet, c'est juste plusieurs briques que tu connais déjà, assemblées ensemble. Prends ton temps sur chaque étape — c'est le dernier effort avant l'arrivée !",
      example:{code:
`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}

    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse

a = Assistant("CaMI")
a.apprendre_regle("bonjour", "Salut !")
print(a.regles)`},
      exercises:[
        {
          id:"iaproj-1", title:"Étape 1 — La classe Assistant",
          instr:`Crée une classe <code>Assistant</code> avec <code>__init__(self, nom)</code> qui stocke <code>self.nom = nom</code> et <code>self.regles = {}</code> (dictionnaire vide). Ajoute <code>apprendre_regle(self, mot_cle, reponse)</code> qui fait <code>self.regles[mot_cle] = reponse</code>. Crée <code>a = Assistant("CaMI")</code>, appelle <code>a.apprendre_regle("bonjour", "Salut !")</code>, puis affiche <code>a.regles</code>.`,
          starter:`class Assistant:
`,
          hints:[
            `self.regles[mot_cle] = reponse fonctionne comme pour un dictionnaire normal, juste sur un attribut.`,
            `class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse

a = Assistant("CaMI")
a.apprendre_regle("bonjour", "Salut !")
print(a.regles)`
          ],
          solution:`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse

a = Assistant("CaMI")
a.apprendre_regle("bonjour", "Salut !")
print(a.regles)`,
          checker:(r)=>outputCheck(r, ["{'bonjour': 'Salut !'}"], {fullMatch:true, failMsg:()=>"a.regles devait contenir {'bonjour': 'Salut !'}."})
        },
        {
          id:"iaproj-2", title:"Étape 2 — L'assistant répond",
          instr:`Reprends la classe <code>Assistant</code>. Ajoute une méthode <code>repondre(self, message)</code> qui parcourt <code>self.regles</code> et retourne la réponse associée au premier mot-clé trouvé dans <code>message.lower()</code>, ou <code>"Je ne sais pas encore."</code> si aucun ne correspond. Crée <code>a = Assistant("CaMI")</code>, apprends-lui <code>("bonjour", "Salut !")</code> et <code>("merci", "Avec plaisir !")</code>, puis affiche <code>a.repondre("Bonjour !")</code> et <code>a.repondre("???")</code>.`,
          starter:`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse

`,
          hints:[
            `Dans repondre, parcours self.regles comme dans le chapitre chatbot : for mot_cle in self.regles: if mot_cle in message.lower(): return self.regles[mot_cle].`,
            `class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse
    def repondre(self, message):
        msg = message.lower()
        for mot_cle in self.regles:
            if mot_cle in msg:
                return self.regles[mot_cle]
        return "Je ne sais pas encore."

a = Assistant("CaMI")
a.apprendre_regle("bonjour", "Salut !")
a.apprendre_regle("merci", "Avec plaisir !")
print(a.repondre("Bonjour !"))
print(a.repondre("???"))`
          ],
          solution:`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse
    def repondre(self, message):
        msg = message.lower()
        for mot_cle in self.regles:
            if mot_cle in msg:
                return self.regles[mot_cle]
        return "Je ne sais pas encore."

a = Assistant("CaMI")
a.apprendre_regle("bonjour", "Salut !")
a.apprendre_regle("merci", "Avec plaisir !")
print(a.repondre("Bonjour !"))
print(a.repondre("???"))`,
          checker:(r)=>outputCheck(r, ["Salut !","Je ne sais pas encore."], {fullMatch:true, failMsg:(exp)=>`Attendu : ${exp.join(" puis ")}.`})
        },
        {
          id:"iaproj-3", title:"Étape 3 — Le classifieur de bagages",
          instr:`Écris une fonction libre (pas une méthode) <code>classer_poids(poids, exemples)</code> qui reprend l'algorithme du plus proche voisin (comme au chapitre classification) : trouve dans <code>exemples</code> (liste de <code>[poids, categorie]</code>) celui dont le poids est le plus proche de <code>poids</code>, et retourne sa catégorie. Teste avec <code>exemples = [[5, "cabine"], [20, "soute"]]</code> et <code>classer_poids(7, exemples)</code>.`,
          starter:`def classer_poids(poids, exemples):

`,
          hints:[
            `Même principe qu'au chapitre précédent : initialise avec le premier exemple, puis compare chaque distance abs(ex[0] - poids).`,
            `def classer_poids(poids, exemples):
    meilleure_distance = abs(exemples[0][0] - poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = abs(ex[0] - poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

exemples = [[5, "cabine"], [20, "soute"]]
print(classer_poids(7, exemples))`
          ],
          solution:`def classer_poids(poids, exemples):
    meilleure_distance = abs(exemples[0][0] - poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = abs(ex[0] - poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

exemples = [[5, "cabine"], [20, "soute"]]
print(classer_poids(7, exemples))`,
          checker:(r)=>outputCheck(r, ["cabine"], {fullMatch:true, failMsg:()=>"7 est plus proche de 5 (cabine) que de 20 (soute)."})
        },
        {
          id:"iaproj-4", title:"Étape 4 — Tout assembler",
          instr:`Reprends <code>Assistant</code> (avec <code>repondre</code>) et <code>classer_poids</code>. Crée <code>a = Assistant("CaMI")</code>, apprends-lui la règle <code>("bagage", "Je verifie la categorie de ton bagage.")</code>. Construis <code>reponse = a.repondre("J ai un bagage")</code> et <code>categorie = classer_poids(7, [[5, "cabine"], [20, "soute"]])</code>. Écris dans un fichier <code>"rapport.txt"</code> le texte <code>reponse + " -> " + categorie</code> avec <code>write_file()</code>, puis relis-le et affiche-le avec <code>read_file()</code>.`,
          starter:`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse
    def repondre(self, message):
        msg = message.lower()
        for mot_cle in self.regles:
            if mot_cle in msg:
                return self.regles[mot_cle]
        return "Je ne sais pas encore."

def classer_poids(poids, exemples):
    meilleure_distance = abs(exemples[0][0] - poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = abs(ex[0] - poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

`,
          hints:[
            `Construis d'abord reponse et categorie séparément, puis assemble-les dans une seule chaîne avant de l'écrire dans le fichier.`,
            `a = Assistant("CaMI")
a.apprendre_regle("bagage", "Je verifie la categorie de ton bagage.")
reponse = a.repondre("J ai un bagage")
categorie = classer_poids(7, [[5, "cabine"], [20, "soute"]])
write_file("rapport.txt", reponse + " -> " + categorie)
print(read_file("rapport.txt"))`
          ],
          solution:`class Assistant:
    def __init__(self, nom):
        self.nom = nom
        self.regles = {}
    def apprendre_regle(self, mot_cle, reponse):
        self.regles[mot_cle] = reponse
    def repondre(self, message):
        msg = message.lower()
        for mot_cle in self.regles:
            if mot_cle in msg:
                return self.regles[mot_cle]
        return "Je ne sais pas encore."

def classer_poids(poids, exemples):
    meilleure_distance = abs(exemples[0][0] - poids)
    meilleure_categorie = exemples[0][1]
    for ex in exemples:
        d = abs(ex[0] - poids)
        if d < meilleure_distance:
            meilleure_distance = d
            meilleure_categorie = ex[1]
    return meilleure_categorie

a = Assistant("CaMI")
a.apprendre_regle("bagage", "Je verifie la categorie de ton bagage.")
reponse = a.repondre("J ai un bagage")
categorie = classer_poids(7, [[5, "cabine"], [20, "soute"]])
write_file("rapport.txt", reponse + " -> " + categorie)
print(read_file("rapport.txt"))`,
          checker:(r)=>outputCheck(r, ["Je verifie la categorie de ton bagage. -> cabine"], {fullMatch:true, failMsg:()=>'Le rapport attendu était "Je verifie la categorie de ton bagage. -> cabine".'})
        }
      ]
    }
  ]
}
};

const PHASE_ORDER: string[] = ["algo","python","avance","ia"];

const TYPED_CURRICULUM: Curriculum = CURRICULUM as Curriculum;
const TYPED_GLOSSARY: GlossaryEntry[] = GLOSSARY as GlossaryEntry[];
const TYPED_MAP_ICONS: Record<string, string> = MAP_ICONS as Record<string, string>;

export { TYPED_CURRICULUM as CURRICULUM, PHASE_ORDER, TYPED_GLOSSARY as GLOSSARY, TYPED_MAP_ICONS as MAP_ICONS };
export default TYPED_CURRICULUM;
