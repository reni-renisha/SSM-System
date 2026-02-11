import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import { formatAadhaar } from "../utils/validation";

// Add styles for input-edit class
const inputEditStyles = `
  .input-edit {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: #f9fafb;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-edit:focus {
    outline: none;
    border-color: #E38B52;
    box-shadow: 0 0 0 3px rgba(227, 139, 82, 0.1);
    background-color: white;
  }
  .input-edit:read-only {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  @keyframes pulsate {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(227, 139, 82, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 8px rgba(227, 139, 82, 0);
    }
  }
  .pulsate-edit {
    animation: pulsate 1s ease-in-out 3;
  }
`;

// Add styles to document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = inputEditStyles;
  document.head.appendChild(styleElement);
}

// Count-up animation component
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

const DynamicScrollButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Define "dead zones" at the top and bottom of the page
      const topThreshold = 200;
      const bottomOffset = 200;

      const isNearBottom =
        window.innerHeight + currentScrollY >=
        document.documentElement.offsetHeight - bottomOffset;

      // 2. Set visibility: only show buttons if we are outside the dead zones
      if (currentScrollY > topThreshold && !isNearBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // 3. Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setIsScrollingUp(false); // User is scrolling DOWN
      } else {
        setIsScrollingUp(true); // User is scrolling UP
      }

      // 4. Update the last scroll position for the next event
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Run on initial mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed z-50 bottom-8 right-8 flex flex-col gap-3 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {isScrollingUp ? (
        // Show Scroll to Top Button when scrolling UP
        <button
          onClick={scrollToTop}
          title="Back to Top"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Back to Top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      ) : (
        // Show Scroll to Bottom Button when scrolling DOWN
        <button
          onClick={scrollToBottom}
          title="Scroll to Bottom"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Scroll to Bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

const SPECIAL_EDU_QUESTIONS = {
  grossmotor: [
    "Holds head erect when in sitting or standing position (body may be supported by a person or prop).",
    "Holds head up for 5 seconds when lying on stomach to look at an object/person.",
    "Sits without support.",
    "Rolls over on flat surface.",
    "Moves from lying on stomach to a sitting position.",
    "Crawls about a room containing furniture and/or other people.",
    "Stands with support.",
    "Pulls self to standing position using person or prop for support.",
    "Stands unsupported.",
    "Walks 5 feet (may use braces or crutches).",
    "Walks upstairs and downstairs putting both feet on each step (may use wall or handrail for support).",
    "Pushes or pulls furniture for rearrangement.",
    "Runs.",
    "Squats.",
    "Walks upstairs and downstairs, alternating feet (may use wall or handrail for support).",
    "Jumps to cross an obstacle (eg. dirty water, rubbish, any floor decoration).",
    "Stands on tip toe to reach for an object at a height.",
    "Walks continuously for a period of 15 minutes.",
    "Carries own luggage to bus stand / station.",
    "Rides a bicycle (without training wheels) / swims.",
  ],
  finemotor: [
    "Closes hand around an object placed in hand.",
    "Reaches for and grasps objects.",
    "Uses both hands at the same time, when handling an object.",
    "Picks up small objects using thumb and fingers only.",
    "Makes a stack of 3 cans, or tiffin carrier containers or wooden blocks.",
    "Uses, a spoon to stir sugar / salt to mix a drink.",
    "Strings three one-inch beads or spools on to a string.",
    "Opens the door, operating door knob/latch/handle.",
    "Screws and unscrews a jar or bottle lid.",
    "Carries a filled paper cup without crushing, tipping or spilling.",
    "Tears off a perforated sheet.",
    "Places key correctly, locks and opens the lock.",
    "Pours liquid from a pitcher into a tumbler without spilling.",
    "Uses clips and safety pins.",
    "Cuts out a picture involving straight lines using scissors, from magazine of a book.",
    "Cuts out a picture involving circular lines, using scissors from a magazine.",
    "Folds a letter, fits into an envelope, applies gum to seal and puts on a stamp.",
    "Cuts/opens sachets / wrappers and empties into a container.",
    "Strikes a safety match to light a candle/lamp",
    "Threads a medium sized sewing needle within 2 tries.",
  ],
  eating: [
    "Swallows soft foods that do not require chewing.",
    "Drinks without spilling, mouthful from glass or cup with assistance.",
    "Bites required amounts of food item.",
    "Differentiates between edible and non-edible substances.",
    "Picks up dry pieces of food (biscuits) with fingers and puts food in mouth.",
    "Chews solid food",
    "Picks up a filled glass and drinks from it without spilling",
    "Uses spoon/hand to pick up and cat mixed food.",
    "Mixes food and eats with little or no spilling (may use fingers/ spoon).",
    "Eats foods, (cereal preparations) such as idli, dosai, preri, roti (Use fingers to make bits).",
    "Eats, supervised in public places without calling attention to eating behaviour.",
    "Eats porridge, payasam (milk pudding), ice cream with little or no spilling.",
    "Eats a complete meal with little or no spilling using all normal eating equipment dishes and utensils.",
    "After eating, empties plate into a trash can and washes it.",
    "Takes appropriate quantities, when food is offered.",
    "While eating, politely asks for food to be passed, and waits for others to finish.",
    "Makes necessary arrangements for and serves food in a family styles setting.",
    "Identifies drinking water in a public place and drinks it.",
    "Selects the required meal items when a variety of food is available.",
    "Orders and eats in a public dining facility.",
  ],
  dressing: [
    "Offers little or no resistance while being dressed and undressed.",
    "Extends and withdraws arms and legs as required while being dressed and undressed.",
    "Removesunbuttoned shirt/blouse, underpants and outer pants.",
    "Removes socks, banians, T Shurts/dresses, when unfastened.",
    "Puts on underpants and outer pants.",
    "Starts and closes a front zipper.",
    "Puts on shirt/blouse.",
    "Unbuttons (shirt button, press buttons, hooks).",
    "Puts on a kurta/banian/TShirt/ dress (need not fasten).",
    "Takes off ties, scarves, belts, hearing aid, spectacles or any Jewellery from self.",
    "Puts socks and shoes (any foot wear) on correct feet.",
    "Buttons clothing: (press buttons/shirt buttons/hooks).",
    "Ties a bow knot with a shoe lace/ ribbon.",
    "Puts on self-ties, scarves, belts, hearing aid, spectacles or any them of jewellery.",
    "Selects clothing appropriate to seasonal / weather conditions and to different occasions.",
    "Selects correct size, type and style of clothing at a store.",
    "Laces shoes inserting the lace in each eyelet correctly.",
    "Wears churidar with dupatia, half saree with skirt / lungi in the correct combinations. (different dress styles)",
    "Dresses self, completely.",
    "Wears dhoti / saree and manages it in the same manner the whole day (traditional dresses)",
  ],
  grooming: [
    "Offers little or no resistance while being washed.",
    "Turns head and extends hands as required while being bathed.",
    "Dries hands with a towel.",
    "Begins brushing motion for cleaning teeth (uses brush or finger).",
    "Rinses hands when told.",
    "Soaps and rinses hands.",
    "Covers mouth while sneezing, coughing and yawning.",
    "Soaps and rinses face.",
    "Uses tooth-paste or tooth powder, brushes teeth and rinses mouth.",
    "Runs a comb or brush through hair with several strokes.",
    "Blows nose, wipes drooling using a handkerchief.",
    "Bathes independently.",
    "Dries entire body with a towel after bathing.",
    "Applies face powder/deodorent/bindi (decoration on forehead)",
    "Washes, rinses and dries hair.",
    "Combs hair including oiling and plaiting (if necessary).",
    "Cleans and clips finger nails with a nail clipper.",
    "Cleans ear, using cotton buds.",
    "Shaves (male) / maintains menstrual hygiene (female)..",
    "Maintains self, clean, odour-free and groomed.",
  ],
  toileting: [
    "Stays dry for two hours",
    "Sits on the toilet for thirty seconds ",
    "Eliminates when on the toilet (bowel or bladder)",
    "Removes clothing before sitting on the toilet.",
    "Goes to the toilet when reminded",
    "Indicates by gestures or words when needed, to use the toilet.",
    "Has bowel control giving time enough to reach the toilet (after indicating)",
    "Has bladder control giving time enough to reach the toilet (after indicating)",
    "Replaces clothing before leaving the toilet.",
    "Removes clothing, sits on the toilet, eliminates and replaces clothing after washing (needs help for washing)",
    "Goes to the toilet independently",
    "Uses only a urinal or toilet for urination",
    "Flushes the toilet after use.",
    "Has bladder control at night.",
    "Closes door of toilet for normal privacy in toileting.",
    "Cleans self-using water after elimination.",
    "Obtains help for any toileting problem.",
    "Asks the location of the toilet in new situations.",
    "Washes and dries hands after toileting.",
    "Chooses the correct toilet (Men/Women) in a public place.",
  ],
  receptivelanguage: [
    "Turns head towards the source of sound.",
    'Responds by eye contact or verbal "acknowledgement when name is called.',
    'Responds to the instruction "Look at me".',
    'Obeys simple instructions such as, "Come here" and so on. ',
    'Stops an activity upon request such as "No" or "Stop".',
    'Performs the activity when the word "Me" is used such as "Give me the ball". ',
    "Identifies different sounds such as bell ringing, hands clapping, whispering, keys jingling.",
    "Responds to non verbal communication from others such as frowning, crying, smiling, etc., by returning the gesture or by giving an appropriate verbal response.",
    "Points to any common object, such as ball, spoon etc., upon request.",
    "Points to 10 body parts such as nose, eyes, mouth etc.",
    "Points to pictures of objects in a book upon request.",
    'Follows prepositions such as "Put the ball into the box" or "Put the broom behind the door".',
    "Avoids dangers when instructed to do so.",
    'Follows two-step directions in order such as, "Get the ball and close the door".',
    "Follows left and right when instructed.",
    'Follows three-step, directions such as "Stand-up", "Open the book and Move the chair".',
    "Identifies common harmful substances even if not labeled.",
    'After listening to a one-page story, indicates "Yes" or "No" to specific questions on it.',
    "Follows announcements on TV, Radio, at railway station, bus stand or airport with appropriate responses.",
    "Responds to jokes (humorous happenings at home and school), with expressions.",
  ],
  expressivelanguage: [
    "Makes voice sounds.",
    "Uses voice sounds to get attention.",
    'Says or indicates, "Yes" or "No" in response to questions.',
    "Imitates five words heard either singularly or all at once.",
    "Says 20 words.",
    "Says name when asked.",
    'Names common objects when asked, "What is this?"',
    'Names 10 body parts when asked, "What is this?"',
    'Uses two-word phrases/gestures such as, "Hello, friend", "Go out" o "Eat biscuit".',
    "Tells/indicates name and occupation of parents.",
    "Communicates address of residence and contact phone number.",
    'Expresses feelings, desires or problems in complete sentences such a "I am hungry", verbally/gesturally.',
    'Asks simple questions such as "What is this?" or "Why can`t I?" verbally/ gesturally,',
    'Uses pronouns such as "I", "You", "He", "Her", "Me" or "Mine" in complete sentence.',
    "Speaks in phrases or sentences/gestures to communicate to someone not familiar with the person.",
    "Names/indicates country, the President, Prime Minister, Chief Minister of the country.",
    "Carries on a meaningful conversation with another person(s) for 10 minutes.",
    "Describes past events in a logical order.",
    "Summarizes a T.V./Radio programme in own words",
    "Discusses current events.",
  ],
  socialinteraction: [
    "Responds when touched, by reaching towards or moving away.",
    "Looks towards or otherwise, indicates a person in the immediate area.",
    "Follows with eyes, a person moving.",
    "Plays alone with toys or objects for 2 minutes.",
    "Imitates arm movements such as dapping hands or waving goodbye.",
    "Identifies by pointing, naming, friends and acquaintances from strangers.",
    "Greets others upon meeting, either verbally or with non-verbal friendly gestures.",
    "Waits for own turn in a group.",
    'Says "Please" and "Thank you" and "Sorry".',
    "Receives guests appropriate to acquaintance (differences in the receiving. of relatives, strangers, gas/electricity men and so on).",
    "Uses items that belong to others, only with their permission.",
    "Objects/asks for help if someone uses own belongings without permission.",
    "Interacts with members of the opposite sex and members of different age groups (as required by his community).",
    "Responds using proper social courtsies on occasions such as festivals, apologizes, offers greeting or compliments as needed.",
    "Participates actively in social events by engaging in the same activity as the other members of the group.",
    "Manages/asks for help if/when teased or bullied.",
    "Receives phone calls/passes on information to the right person when given messages personally or by phone.",
    "Shares possessions with others (in classroom, home and community).",
    "Participates in group activities taking the role of a leader.",
    "Visits neighbours, relatives and friends when required",
  ],
  reading: [
    "Looks at objects presented when seated at a table.",
    "Tums the pages of a book, one at a time.",
    "Matches 10 pictures with objects.",
    "Sorts objects of 3 different shapes.",
    "Identifies names, colours (red, yellow, blue and green) when objects with those colours are presented",
    "Sort pictures of similar and/or familiar objects into the same category Eg. Animals, people, vehicles, fruits, flowers etc.",
    "Reads out functional 3 letter words.",
    "Shown 5 pictures sequentially arranged and told a story with them, pictures then jumbled up, arranges them again in sequence.",
    "When needed reads the following words and acts accordingly: Stop, Men, Women, Danger, Poison, Exit, Pull, Push, In, Out, Enter.",
    "Reads out functional two word phrases.",
    "Using price tags/price markings, identifies cost of purchases.",
    "Reads aloud, sentences with five common words.",
    "Reads a simple sentence and answers questions about it.",
    "Reads a paragraph (5 lines) and answers questions.",
    "Uses a menu card to order meals at restaurants.",
    "Reads a story to others.",
    "Reads for information or entertainment from newspapers, magazines and story books.",
    "Reads a simple story silently and states its main idea.",
    "Reads out a recipe for cooking.",
    "Reads and follows directions with objects to be assembled.",
  ],
  writing: [
    "Grasps chalk, pencil or crayon.",
    "Scribbles with chalk, pencil, or crayon.",
    "Grasps chalk, pencil or crayon for writing with thumb, index finger and middle finger.",
    "Traces with pencil or crayon along a three-inch straight line.",
    "Colours with lines.",
    "Copies with a pencil, a vertical, a horizontal or a diagonal line.",
    "Traces three circles and semi circles.",
    "Traces geometric shapes (square, rectangle, and triangle).",
    "Traces three letter functional words.",
    "Copies his name.",
    "Writes his name readably with initials or father`s name with no example to look at.",
    "Copies a printed sentence readably.",
    "Writes address and phone number readably.",
    "Copies a paragraph readably with punctuations on / to a sheet of lined paper wring on the lines",
    "Writes functional dictated words readably",
    "Writes a short sentence readably when dictated.",
    "Writes answers readably to questions after reading a paragraph.",
    "Writes a paragraph of 5 lines readably on a given topic.",
    "Writes personal letters for mailing using legible handwriting in an informal letter style.",
    "Fills / writes an application form readably.",
  ],
  numbers: [
    "Creates order out of a group of objects by lining up, stacking or placing them in some other pattern. ",
    'Indicates the difference between "more" and "less" when shown two different sized groups of objects.',
    'Separates one object from a group upon request, eg. "Give me one block".',
    'Points to "big/small" when asked.',
    'Points to "short", "long" and "tall" when asked.',
    'Chooses the correct number of objects up to 5 upon request eg. "Give me three blocks" etc.',
    "Chooses correct number of objects up to 10.",
    "Names the printed number symbols, 1 through 10 when asked at random.",
    "Performs activities according to the ordinal number (1st,2nd,3rd)eg. Forming a queue according to the number given.",
    "Writes the number symbols 1 through 10.",
    "Counts from 10 to 20.",
    "Matches the printed number symbols 1 through 100 with the correct number of objects.",
    "Does 3 line single digit addition on paper?",
    "Adds single digit numbers with sums up to 10 such as 7+3, 2+1 or 8+ 2in functional situation eg.ina purchase.",
    "Subtracts single digit addition on paper.",
    "Does two line two digit addition on paper with carry over.",
    "Does subtraction sums - two digits with borrowing on paper.",
    "Does simple two operations in a shopping situation eg, buy 2 things costing Rs. 3 and Rs.5 and balance for Rs.10.",
    "Says multiplication tables 5 and 10.",
    "Uses a simple calculator with basic four operations.",
  ],
  time: [
    "Associates the time of the day with activities such as meals time or bed time.",
    'Responds to "Now", "Later", "Hurry" and "Wait" appropriately.',
    'Answers appropriatelywhenasked, "Is it morning or afternoon, evening / night".',
    "Indicates  statingowe age.",
    "Indicates the difference between yesterday, today and tomorrow, using the terms in the correct context. ",
    "Identifies or names the 7 days of the week in a calendar.",
    'Answers/points out correctly when asked "What day of the week and date is it today".',
    "Identifies or names hour hand, minute hand and numbers on a clock.",
    "Identifies or names the 12 months of the year in a calendar.",
    'Answers/ indicates when asked "What month and year is it now.',
    "Identifies or names the seasons of the year",
    "Identifies or tells birth - date, month, day and year.",
    "Tells time by the hour on a clock.",
    "Reads time on a digital clock.",
    "Tells time by 30 minutes.",
    "Tells time to five minutes on a clock or watch",
    "Meets a particular scheduled bus.",
    "Road TV, Radios and Train schedules.",
    "Arrives on time (date and time) for any appointment (egmarriage, parties, cinema, doctors).",
    "Sets a clock to within one hour of the correct time after hearing the correct time.",
  ],
  money: [
    "Sorts coins from other small metal objects.",
    "Selects a rupee note from other paper objects.",
    "Selects 5p. 10p, 20p, 25p and 50p, 1 Rs and 2 Rs. coins from a group of coins. ",
    "Uses money to buy things (might not use correct amount).",
    "Identifies 1, 4, 5, 10, 20, 50 and 100 rupee notes.",
    "Rank orders coins and rupee notes in order of value.",
    "Exchanges 10p coins for Rs.1.",
    "Exchanges 25p coins and 50p coins for Rs.1.",
    "Exchanges 5p.coins for Rs.1.",
    "Exchanges the correct number of mixed coins for Rs.1.",
    "Exchanges the correct number of mixed coins and rupee notes for Rs.5.",
    "Uses correct amount of money for machines (weighing machine, telephone)",
    "Exchanges the correct number of mixed coins and rupee notes for Rs.50.",
    "Saves money for a purchase.",
    "Counts the change from a purchase of Rs.5 or less checking the Quantity bought.",
    "Gives an adequate amount of money for purchases up to Rs.20 checking the quantity bought and counts the change.",
    "Counts the change from a purchase up to Rs.50 checking the quantity bought.",
    "Counts change from a purchase up to Rs.100 checking the quantity bought.",
    "Selects an item comparing the prices (concept of expensive, cheap).",
    "Saves money in a bank account.",
  ],
  domesticbehaviour: [
    "Picks up household trash or litter and places it in a waste basket upon request.",
    "Puts away personal items in the proper location upon request.",
    "Dusts furniture leaving no dust on flat surfaces.",
    "Damp wipes a floor.",
    "Folds clothes and puts them in a drawer/cupboard.",
    "Makes bed, stretching, spreading, rolling, folding.",
    "Sorts vegetable/grocery items bought from market and stores them in respective containers.",
    "Sweeps a floor with a broom, picks up sweepings in a dust pan and empties the pan.",
    "Washes and dries dishes.",
    "Prepares pre-made drinks (like Rasna) when asked.",
    "Peels and cuts vegetables and fruits.",
    "Operates a grinder, mixie or grinding stone.",
    "Puts off the fire or removes cooker, cooking utensil from the fire in time.",
    "Assists in simple first aid.",
    "When required, uses a weighing machine, measuring tape or measuring cup.",
    "Prepares coffee or tea.",
    "Washes and dries clothes.",
    "Irons clothes.",
    "Does simple home repairs (such as sewing on buttons or re-joining broken seams, using needle and thread or machine, uses nail hammer, screw driver).",
    "Prepares a meal under supervision.",
  ],
  communityorientation: [
    "Performs simple errands within a familiar setting.",
    "Finds way by self from one place to another within a familiar building)",
    "Finds way from one building to another in the immediate neighbourhood.",
    "Goes to public places in a supervised group without calling unfavourable attention to self.",
    "Identifies a police man, postman, and a fireman, conductor of a bus a delivery man and telephone serviceman and persons from power supply.",
    "Interacts with strangers in public (as the situation warrants).",
    "Crosses residential street intersections, looking in both directions and waiting for traffic to clear before crossing.",
    "Walks along road that has no sidewalk - maintains left side.",
    "Responds appropriately to social kidding, teasing in public.",
    "Moves about freely in his neighbourhoodeg., school, post office, milk booth, market, place of worship.",
    "When goes out with a group, maintains the group norms.",
    'Obeys signal lights and "Walk" "Don`t walk" signals at light controlled intersections.',
    "Goes on foot or bicycle to a familiar place over half a kilometer from residence and returns.",
    "Travels independently by public bus/suburban train in a familiar route.",
    "Participates in religious activities following rules (Poga/Prayer).",
    "Leaves an awkward public situation that is beyond control and seeks help.",
    "Telephones for information or assistance when necessary.",
    "Follows directions in terms of east, west, north, south and reaches thedestination.",
    "Uses community facilities eg., hospital, railway, bus police station and post office.",
    "Casts vote.",
  ],
  recreation: [
    "Engages in a leisure-time activity for 5 minutes when materials are given.",
    "Plays simple ball games like candling, throwing, bouncing and rolling a ball.",
    "Watches TV without disturbing others.",
    "Engages in activities such as finger painting/trash painting",
    "Plays indoor games not governed by rules with others.",
    "Participates in group singing or dancing (activity or passively).",
    "Plays simple outdoor games not governed by rules eg. Sand play.",
    "Plays outdoor games involving simple rules with others.",
    "Plays indoor games, governed by simple rules.",
    "Watches TV or listens to the radio, tape recorder by selecting a station/channel turning on and off, including use of cassettes.",
    "Involves in activities such as playing with pets, or hobbies such as collection of pictures and so on.",
    "Participates in outdoor activities, swimming/ cycling / walking/ playing.",
    "Performs art and craft activities such as clay work, leather work or bead work/rangoli/kolam and so on.",
    "Initiates self-involvement in a hobby, not including reading or watching TV.",
    "Does gardening/makes flower garlands/mango leaf chain for the door.",
    "Participates in organized team sports such as cricket, basketball or volley ball.",
    "Uses community recreation facilities for recreation and leisure time activities - theatres, parks and other amusement places",
    "Participates in planning, preparing for parties and so on.",
    "Selects books from library for personal reading.",
    "Plays a musical instrument/sings (solo)",
  ],
  vocational: [
    "Assumes a body position at a task or at play such that both hands are available for use.",
    "Participates in a single activity for 10 minutes (if protected from interference).",
    "Performs a single activity under supervision, in a room with people.",
    "Assembles two-part objects that fit together in a simple but secure way.",
    "Performs an assigned task or activity for half an hour (may need motivation with rewards).",
    "Puts away own tools and materials at the end of a task (may need a reminder up to one-half of the time).",
    "Stops a task when required.",
    "Participates in group work cooperating with the other members of the group.",
    "Changes activity without showing discomfort when assigned-from one task to a different task.",
    "Accepts supervision and criticism.",
    "Goes to an assigned area without reminder in a daily routine programme.",
    "Undertakes and completes a task in order to receive money.",
    "Reads and then follows the notices, memorandums/circulars. If not able to read, asks for assistance and then follows.",
    "Reports for work on time.",
    "Increases speed of work when told to do so.",
    "Follows the sequence of activities in the routine work skill.",
    "Indicates if own performances meet the standards set for an activity.",
    "Works full time (8 hours).",
    "When situation demands, works in a team.",
    "Responds to accidents like fire, electricity, injury by informing the concerned people immediately.",
  ],
};

const SPECIAL_EDU_SKILLS = [
  { key: "grossmotor", label: "Gross Motor" },
  { key: "finemotor", label: "Fine Motor" },
  { key: "eating", label: "Eating" },
  { key: "dressing", label: "Dressing" },
  { key: "grooming", label: "Grooming" },
  { key: "toileting", label: "Toileting" },
  { key: "receptivelanguage", label: "Receptive Language" },
  { key: "expressivelanguage", label: "Expressive Language" },
  { key: "socialinteraction", label: "Social Interaction" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "numbers", label: "Numbers" },
  { key: "time", label: "Time" },
  { key: "money", label: "Money" },
  { key: "domesticbehaviour", label: "Domestic Behaviour" },
  { key: "communityorientation", label: "Community Orientation" },
  { key: "recreation", label: "Recreation" },
  { key: "vocational", label: "Vocational" },
];

const SPECIAL_EDU_ASSESSMENT_PHASES = [
  "1st assmt",
  "1st Qtr",
  "2nd Qtr",
  "3rd Qtr",
  "4th Qtr",
];

// Helper function to determine the highest filled phase for a table
const getHighestFilledPhase = (table) => {
  if (!table) return "1st assmt";

  const quarterOverrides = table.quarterOverrides || {};
  const phases = ["4th Qtr", "3rd Qtr", "2nd Qtr", "1st Qtr", "1st assmt"];

  // Check phases from highest to lowest
  for (const phase of phases) {
    if (phase === "1st assmt") {
      // 1st assessment always exists if table has rows
      if (table.rows && table.rows.length > 0) {
        return "1st assmt";
      }
    } else {
      // Quarter phases: check if there are any overrides
      const phaseOverrides = quarterOverrides[phase];
      if (phaseOverrides && Object.keys(phaseOverrides).length > 0) {
        return phase;
      }
    }
  }

  return "1st assmt"; // fallback
};

// Order of quadrants for cascaded edits
const SPECIAL_EDU_PHASE_ORDER = ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'];

function getEffectiveValueForPhase(baseVal, cellKey, phase, snapshots) {
  if (!phase || phase === '1st assmt') return baseVal;

  const idx = SPECIAL_EDU_PHASE_ORDER.indexOf(phase);
  if (idx === -1) return baseVal;

  let v = baseVal;
  for (let i = 0; i <= idx; i++) {
    const p = SPECIAL_EDU_PHASE_ORDER[i];
    const map = snapshots[p];
    if (map && map[cellKey] != null) v = map[cellKey];
  }
  return v;
}

const normalizeSectionKey = (label) =>
  String(label || "")
    .toLowerCase()
    .normalize("NFKD") // remove accents
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z]/g, ""); // keep only letters

const StudentPage = () => {
  // Refs for date pickers
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [activeTab, setActiveTab] = useState("student-details");
  const [activeCaseSection, setActiveCaseSection] = useState("identification");
  const [activeEducationSubsection, setActiveEducationSubsection] =
    useState("self-help");
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); // show latest 5 by default
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [selectedTherapyType, setSelectedTherapyType] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  // AI summary related state
  const [aiSummary, setAiSummary] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null); // Full comprehensive analysis
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [aiModel, setAiModel] = useState("meta-llama/Llama-3.2-3B-Instruct");

  // IEP OCR state
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [extractedTables, setExtractedTables] = useState([]);
  const [savedTables, setSavedTables] = useState([]);
  const [ocrMethod, setOcrMethod] = useState(null);
  const [reportDate, setReportDate] = useState("");
  const [extractionNotification, setExtractionNotification] = useState(null);
  const [showTableDetails, setShowTableDetails] = useState({});
  const [tableSavedStatus, setTableSavedStatus] = useState({});
  const [extractionData, setExtractionData] = useState(null);
  const [extractionSummary, setExtractionSummary] = useState(null);
  const fileInputRef = useRef(null);

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState(null);

  // IEP Report state
  const [iepData, setIepData] = useState({
    selectedMonth: "",
    tableRows: [{ id: 1, adlSkills: "", academic: "", behaviouralSkills: "" }],
    iepStudent: "",
    remarks: "",
    signatures: {
      principal: "",
      teacher: "",
      parent: "",
    },
  });
  const [savingIep, setSavingIep] = useState(false);

  // Handle translation - always translates to Malayalam
  const handleTranslate = async () => {
    setTranslating(true);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const summaryText = aiAnalysis?.summary || "";

      if (!summaryText.trim()) {
        throw new Error(
          "No AI summary available to translate. Please generate AI summary first.",
        );
      }

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const res = await fetch(`${baseUrl}/api/v1/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: summaryText,
          target_language: "mal_Mlym",
          source_language: "eng_Latn",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Translation failed: ${res.status}`,
        );
      }

      const data = await res.json();
      setTranslatedSummary(data.translated_text);
    } catch (e) {
      alert(`Translation failed: ${e.message}`);
      setTranslatedSummary(null);
    } finally {
      setTranslating(false);
    }
  };

  // IEP Functions
  const handleIepInputChange = (field, value) => {
    setIepData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTableRowChange = (rowId, column, value) => {
    setIepData((prev) => ({
      ...prev,
      tableRows: prev.tableRows.map((row) =>
        row.id === rowId ? { ...row, [column]: value } : row,
      ),
    }));
  };

  const addTableRow = () => {
    const newId = Math.max(...iepData.tableRows.map((row) => row.id)) + 1;
    setIepData((prev) => ({
      ...prev,
      tableRows: [
        ...prev.tableRows,
        { id: newId, adlSkills: "", academic: "", behaviouralSkills: "" },
      ],
    }));
  };

  const removeTableRow = (rowId) => {
    if (iepData.tableRows.length > 1) {
      setIepData((prev) => ({
        ...prev,
        tableRows: prev.tableRows.filter((row) => row.id !== rowId),
      }));
    }
  };

  const handleSignatureChange = (signatureType, value) => {
    setIepData((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [signatureType]: value,
      },
    }));
  };

  const saveIepData = async () => {
    try {
      setSavingIep(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      // For now, save to localStorage (since no backend endpoint exists yet)
      const iepKey = `iep_data_student_${id}`;
      localStorage.setItem(iepKey, JSON.stringify(iepData));

      // TODO: Replace with actual API call when backend endpoint is available
      // await axios.post(`${baseUrl}/api/v1/students/${id}/iep`, iepData, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      showToast("IEP data saved successfully!", "success");
    } catch (error) {
      console.error("Error saving IEP data:", error);
      showToast("Failed to save IEP data", "error");
    } finally {
      setSavingIep(false);
    }
  };

  const loadIepData = () => {
    try {
      const iepKey = `iep_data_student_${id}`;
      const savedData = localStorage.getItem(iepKey);
      if (savedData) {
        setIepData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Error loading IEP data:", error);
    }
  };

  const downloadIepAsPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("TRIMESTER REPORT", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Subtitle
    pdf.setFontSize(16);
    pdf.text("Individual Education Program (IEP)", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 20;

    // Student Info
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Student: ${student?.name || "N/A"}`, 20, yPosition);
    pdf.text(
      `Month: ${iepData.selectedMonth || "N/A"}`,
      pageWidth - 80,
      yPosition,
    );
    yPosition += 20;

    // Table Headers
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    const colWidth = (pageWidth - 40) / 3;

    pdf.rect(20, yPosition - 5, colWidth, 10);
    pdf.rect(20 + colWidth, yPosition - 5, colWidth, 10);
    pdf.rect(20 + 2 * colWidth, yPosition - 5, colWidth, 10);

    pdf.text("ADL SKILLS", 20 + colWidth / 2, yPosition, { align: "center" });
    pdf.text("ACADEMIC", 20 + colWidth + colWidth / 2, yPosition, {
      align: "center",
    });
    pdf.text(
      "BEHAVIOURAL SKILLS",
      20 + 2 * colWidth + colWidth / 2,
      yPosition,
      { align: "center" },
    );
    yPosition += 15;

    // Table Rows
    pdf.setFont("helvetica", "normal");
    iepData.tableRows.forEach((row, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      const rowHeight = 15;
      pdf.rect(20, yPosition - 5, colWidth, rowHeight);
      pdf.rect(20 + colWidth, yPosition - 5, colWidth, rowHeight);
      pdf.rect(20 + 2 * colWidth, yPosition - 5, colWidth, rowHeight);

      // Text wrapping for long content
      const maxWidth = colWidth - 10;
      const adlLines = pdf.splitTextToSize(row.adlSkills || "", maxWidth);
      const academicLines = pdf.splitTextToSize(row.academic || "", maxWidth);
      const behaviouralLines = pdf.splitTextToSize(
        row.behaviouralSkills || "",
        maxWidth,
      );

      pdf.text(adlLines, 25, yPosition, { maxWidth });
      pdf.text(academicLines, 25 + colWidth, yPosition, { maxWidth });
      pdf.text(behaviouralLines, 25 + 2 * colWidth, yPosition, { maxWidth });

      yPosition += Math.max(
        rowHeight,
        Math.max(
          adlLines.length,
          academicLines.length,
          behaviouralLines.length,
        ) * 5,
      );
    });

    yPosition += 20;

    // IEP Section
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("IEP OF THE STUDENT:", 20, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    const iepLines = pdf.splitTextToSize(
      iepData.iepStudent || "",
      pageWidth - 40,
    );
    pdf.text(iepLines, 20, yPosition);
    yPosition += iepLines.length * 5 + 15;

    // Remarks Section
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("REMARKS:", 20, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    const remarksLines = pdf.splitTextToSize(
      iepData.remarks || "",
      pageWidth - 40,
    );
    pdf.text(remarksLines, 20, yPosition);
    yPosition += remarksLines.length * 5 + 30;

    // Signatures Section
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("Signatures:", 20, yPosition);
    yPosition += 20;

    const signatureWidth = (pageWidth - 60) / 3;
    pdf.text("Principal", 20, yPosition);
    pdf.text("Teacher", 20 + signatureWidth + 20, yPosition);
    pdf.text("Parent", 20 + 2 * (signatureWidth + 20), yPosition);

    yPosition += 10;
    pdf.line(20, yPosition, 20 + signatureWidth, yPosition);
    pdf.line(
      20 + signatureWidth + 20,
      yPosition,
      20 + 2 * signatureWidth + 20,
      yPosition,
    );
    pdf.line(
      20 + 2 * (signatureWidth + 20),
      yPosition,
      20 + 3 * signatureWidth + 40,
      yPosition,
    );

    if (iepData.signatures.principal) {
      pdf.setFontSize(10);
      pdf.text(iepData.signatures.principal, 20, yPosition + 15);
    }
    if (iepData.signatures.teacher) {
      pdf.setFontSize(10);
      pdf.text(
        iepData.signatures.teacher,
        20 + signatureWidth + 20,
        yPosition + 15,
      );
    }
    if (iepData.signatures.parent) {
      pdf.setFontSize(10);
      pdf.text(
        iepData.signatures.parent,
        20 + 2 * (signatureWidth + 20),
        yPosition + 15,
      );
    }

    // Save PDF
    const fileName = `IEP_Report_${student?.name?.replace(/\s+/g, "_")}_${iepData.selectedMonth}.pdf`;
    pdf.save(fileName);
  };

  const [activeSkillByTable, setActiveSkillByTable] = useState({});
  const [questionsOpenByTable, setQuestionsOpenByTable] = useState({});
  const [activeQuestionByTable, setActiveQuestionByTable] = useState({}); // Track active question index per table
  const questionRefs = useRef({}); // Refs for scrolling to questions
  const [pulsatingEditButton, setPulsatingEditButton] = useState({}); // Track which table's edit button should pulsate

  const handleAISummarize = async () => {
    setAiSummaryError(null);
    setAiSummary("");
    setAiAnalysis(null);
    // Build server payload based on current filters
    const payload = {
      student_id: student?.studentId || id,
      from_date: fromDate || null,
      to_date: toDate || null,
      therapy_type: selectedTherapyType || null,
      model: aiModel,
      max_length: 280,
      min_length: 60,
    };
    if (!payload.student_id) {
      setAiSummaryError("Missing student id");
      return;
    }
    setAiSummarizing(true);
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/v1/therapy-reports/summary/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      const data = await res.json();

      // Set the comprehensive analysis data
      setAiAnalysis(data);
      setAiSummary(data.summary || "(No summary returned)");
    } catch (e) {
      console.error("AI summarize failed", e);
      setAiSummaryError(e.message);
    } finally {
      setAiSummarizing(false);
    }
  };

  // PDF generation for AI Analysis Report
  const generateAIAnalysisPDF = () => {
    if (!aiAnalysis || !student) {
      alert("No AI analysis data available to export");
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    // Header
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("AI Therapy Analysis Report", marginLeft, yPosition);
    yPosition += 10;

    // Student Information
    pdf.setFontSize(12);
    pdf.setFont(undefined, "normal");
    pdf.text(`Student: ${student.name || "N/A"}`, marginLeft, yPosition);
    yPosition += 7;
    pdf.text(
      `Student ID: ${student.student_id || "N/A"}`,
      marginLeft,
      yPosition,
    );
    yPosition += 7;
    if (student.class_name) {
      pdf.text(`Class: ${student.class_name}`, marginLeft, yPosition);
      yPosition += 7;
    }
    pdf.text(
      `Reports Analyzed: ${aiAnalysis.used_reports || 0}`,
      marginLeft,
      yPosition,
    );
    yPosition += 7;
    if (aiAnalysis.date_range) {
      pdf.text(
        `Analysis Period: ${aiAnalysis.date_range.start_date || "N/A"} to ${aiAnalysis.date_range.end_date || "N/A"}`,
        marginLeft,
        yPosition,
      );
      yPosition += 10;
    }

    // PROGRESS SUMMARY - Main consolidated report
    if (aiAnalysis.summary) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.text("PROGRESS SUMMARY", marginLeft, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");

      // Split the summary text and handle page breaks
      const summaryLines = pdf.splitTextToSize(
        aiAnalysis.summary,
        contentWidth,
      );
      summaryLines.forEach((line) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, marginLeft, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, marginLeft, 285);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, 285);
    }

    // Save the PDF
    const fileName = `AI_Analysis_Report_${student.student_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
  };

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aadharEditError, setAadharEditError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Document upload states
  const [documents, setDocuments] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const documentInputRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Toast notification helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 4000);
  };

  const caseRecordCompletion = React.useMemo(() => {
    if (!student) return 0; // Define the key fields that constitute a "complete" case record
    const fieldsToCheck = [
      student.bloodGroup,
      student.category,
      student.informantName,
      student.presentComplaints,
      student.previousTreatments,
      student.totalFamilyIncome,
      student.household?.length > 0, // Check if there are any household members
      Object.keys(student.familyHistory || {}).length > 0, // Check for any family history
      Object.keys(student.birthHistory || {}).length > 0,
      Object.keys(student.developmentHistory || {}).length > 0,
      Object.keys(student.assessment || {}).length > 0,
    ];

    const completedFields = fieldsToCheck.filter((field) => {
      if (typeof field === "boolean") return field === true;
      return field; // This checks for non-empty strings, non-zero numbers, etc.
    }).length;

    const totalFields = fieldsToCheck.length;
    if (totalFields === 0) return 100;

    const percentage = Math.round((completedFields / totalFields) * 100);
    return percentage;
  }, [student]); // This calculation re-runs only when the 'student' object changes

  // Start editing: initialize editData
  const handleEditStart = () => {
    setEditMode(true);
  };

  // Handle input change in edit mode
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // Prevent editing studentId
    if (name === "studentId") return;
    // Special handling for Aadhaar formatting/validation
    if (name === "aadharNumber") {
      const raw = String(value || "");
      const digits = raw.replace(/\D/g, "").slice(0, 12);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      setEditData((prev) => ({ ...prev, [name]: formatted }));

      if (digits.length !== 12) {
        setAadharEditError("Aadhaar must be exactly 12 digits.");
      } else if (/^[01]/.test(digits)) {
        setAadharEditError("Aadhaar must start with a digit between 2 and 9.");
      } else {
        setAadharEditError("");
      }
      return;
    }

    // IFSC: uppercase letters, no spaces, max 11 chars
    if (name === "ifscCode") {
      const v = String(value || "")
        .replace(/\s+/g, "")
        .toUpperCase()
        .slice(0, 11);
      setEditData((prev) => ({ ...prev, [name]: v }));
      return;
    }

    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Cancel editing
  const handleEditCancel = () => {
    // Remove non-editable fields from student state for editData
    if (!student) return;
    // Only include editable fields
    const {
      studentId,
      photoUrl,
      address, // non-editable
      ...editableFields
    } = student;
    setEditData(editableFields);
    setEditMode(false);
  };

  // Save changes
  const handleEditSave = async () => {
    try {
      // Prevent saving when Aadhaar validation failed
      if (aadharEditError) {
        alert(aadharEditError || "Invalid Aadhaar number");
        return;
      }
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

      // This payload correctly maps your form state to what the API expects
      const payload = {
        name: editData.name,
        age: editData.age,
        dob: editData.dob,
        gender: editData.gender,
        religion: editData.religion,
        caste: editData.caste,
        class_name: editData.class,
        roll_no: editData.rollNo,
        birth_place: editData.birthPlace,
        house_name: editData.houseName,
        street_name: editData.streetName,
        post_office: editData.postOffice,
        pin_code: editData.pinCode,
        revenue_district: editData.revenueDistrict,
        block_panchayat: editData.blockPanchayat,
        local_body: editData.localBody,
        taluk: editData.taluk,
        phone_number: editData.phoneNumber,
        email: editData.email,
        father_name: editData.fatherName,
        father_education: editData.fatherEducation,
        father_occupation: editData.fatherOccupation,
        mother_name: editData.motherName,
        mother_education: editData.motherEducation,
        mother_occupation: editData.motherOccupation,
        guardian_name: editData.guardianName,
        guardian_relationship: editData.guardianRelationship,
        guardian_contact: editData.guardianContact,
        guardian_occupation: editData.guardianOccupation,
        total_family_income: editData.totalFamilyIncome,
        academic_year: editData.academicYear,
        admission_number: editData.admissionNumber,
        admission_date: editData.admissionDate,
        class_teacher: editData.classTeacher,
        bank_name: editData.bankName,
        account_number: editData.accountNumber,
        branch: editData.branch,
        ifsc_code: editData.ifscCode,
        aadhar_number: editData.aadharNumber
          ? String(editData.aadharNumber).replace(/\s+/g, "")
          : null,
        blood_group: editData.bloodGroup,
        category: editData.category,
        // Case record specific fields
        informant_name: editData.informantName,
        informant_relationship: editData.informantRelationship,
        duration_of_contact: editData.durationOfContact,
        present_complaints: editData.presentComplaints,
        previous_treatments: editData.previousTreatments,
        // Family History
        family_history_mental_illness: editData.familyHistory?.mental_illness,
        family_history_mental_retardation:
          editData.familyHistory?.mental_retardation,
        family_history_epilepsy: editData.familyHistory?.epilepsy,
        // Birth History
        prenatal_history: editData.birthHistory?.prenatal,
        natal_history: editData.birthHistory?.natal,
        postnatal_history: editData.birthHistory?.postnatal,
        // Development History
        smiles_at_other: editData.developmentHistory?.smiles_at_other,
        head_control: editData.developmentHistory?.head_control,
        sitting: editData.developmentHistory?.sitting,
        responds_to_name: editData.developmentHistory?.responds_to_name,
        babbling: editData.developmentHistory?.babbling,
        first_words: editData.developmentHistory?.first_words,
        standing: editData.developmentHistory?.standing,
        walking: editData.developmentHistory?.walking,
        two_word_phrases: editData.developmentHistory?.two_word_phrases,
        toilet_control: editData.developmentHistory?.toilet_control,
        sentences: editData.developmentHistory?.sentences,
        physical_deformity: editData.developmentHistory?.physical_deformity,
        // Additional Info
        school_history: editData.additionalInfo?.school_history,
        occupational_history: editData.additionalInfo?.occupational_history,
        behaviour_problems:
          editData.assessment?.behaviour_problems ||
          editData.additionalInfo?.behaviour_problems,
        // Assessment - Self Help
        eating_habits: editData.assessment?.self_help?.food_habits?.eating,
        drinking_habits: editData.assessment?.self_help?.food_habits?.drinking,
        toilet_habits: editData.assessment?.self_help?.toilet_habits,
        brushing: editData.assessment?.self_help?.brushing,
        bathing: editData.assessment?.self_help?.bathing,
        dressing_removing_wearing:
          editData.assessment?.self_help?.dressing?.removing_and_wearing,
        dressing_buttoning: editData.assessment?.self_help?.dressing?.buttoning,
        dressing_footwear: editData.assessment?.self_help?.dressing?.footwear,
        dressing_grooming: editData.assessment?.self_help?.dressing?.grooming,
        // Assessment - Motor
        gross_motor: editData.assessment?.motor?.gross_motor,
        fine_motor: editData.assessment?.motor?.fine_motor,
        // Assessment - Sensory
        sensory: editData.assessment?.sensory,
        // Assessment - Socialization
        language_communication:
          editData.assessment?.socialization?.language_communication,
        social_behaviour: editData.assessment?.socialization?.social_behaviour,
        mobility_in_neighborhood: editData.assessment?.socialization?.mobility,
        // Assessment - Cognitive
        attention: editData.assessment?.cognitive?.attention,
        identification_of_objects:
          editData.assessment?.cognitive?.identification_of_objects,
        use_of_objects: editData.assessment?.cognitive?.use_of_objects,
        following_instruction:
          editData.assessment?.cognitive?.following_instruction,
        awareness_of_danger:
          editData.assessment?.cognitive?.awareness_of_danger,
        concept_color: editData.assessment?.cognitive?.concept_formation?.color,
        concept_size: editData.assessment?.cognitive?.concept_formation?.size,
        concept_sex: editData.assessment?.cognitive?.concept_formation?.sex,
        concept_shape: editData.assessment?.cognitive?.concept_formation?.shape,
        concept_number:
          editData.assessment?.cognitive?.concept_formation?.number,
        concept_time: editData.assessment?.cognitive?.concept_formation?.time,
        concept_money: editData.assessment?.cognitive?.concept_formation?.money,
        // Assessment - Academic
        academic_reading: editData.assessment?.academic?.reading,
        academic_writing: editData.assessment?.academic?.writing,
        academic_arithmetic: editData.assessment?.academic?.arithmetic,
        // Assessment - Prevocational
        prevocational_ability:
          editData.assessment?.prevocational?.ability_and_interest,
        prevocational_interest:
          editData.assessment?.prevocational?.items_of_interest,
        prevocational_dislike:
          editData.assessment?.prevocational?.items_of_dislike,
        // Assessment - Other
        any_other: editData.assessment?.any_other,
        recommendation: editData.assessment?.recommendation,
        // Medical Information
        specific_diagnostic: editData.specific_diagnostic,
        medical_conditions: editData.medical_conditions,
        is_on_regular_drugs: editData.is_on_regular_drugs,
        drug_allergy: editData.drug_allergy,
        food_allergy: editData.food_allergy,
        allergies: editData.allergies,
      };
      // If photoFile is set, upload photo first, then update details
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        try {
          const res = await axios.post(
            `${baseUrl}/api/v1/students/${id}/photo`,
            formData,
          );
          const returned = res.data;
          console.debug("Photo upload (during save) response:", returned);
          const returnedPhoto =
            returned?.photo_url || returned?.photoUrl || null;
          if (returnedPhoto) {
            // set both conventions so other components can read either
            setStudent((prev) => ({
              ...(prev || {}),
              photoUrl: returnedPhoto,
              photo_url: returnedPhoto,
            }));
          } else {
            console.warn(
              "Photo upload returned no photo_url/photoUrl during save:",
              returned,
            );
          }
          // clear file input and revoke preview
          try {
            if (fileInputRef && fileInputRef.current)
              fileInputRef.current.value = null;
          } catch (err) {}
          if (photoPreview) {
            try {
              URL.revokeObjectURL(photoPreview);
            } catch (err) {}
          }
        } catch (err) {
          console.warn("Photo upload during save failed", err);
        } finally {
          setPhotoFile(null);
          setPhotoPreview(null);
        }
      }
      const putRes = await axios.put(
        `${baseUrl}/api/v1/students/${id}`,
        payload,
      );
      const putData = putRes?.data;
      // If backend returned updated student with photo, update UI immediately
      if (putData) {
        const pdPhoto = putData.photo_url || putData.photoUrl || null;
        if (pdPhoto) {
          setStudent((prev) => ({
            ...(prev || {}),
            photoUrl: pdPhoto,
            photo_url: pdPhoto,
          }));
        }
      }

      // Refresh the data cleanly (best-effort) and exit edit mode
      try {
        await fetchStudent();
      } catch (err) {
        console.warn("Could not refresh after save", err);
      }
      setEditMode(false);
    } catch (e) {
      console.error("Failed to save changes:", e);
      alert("Could not save changes. Please try again.");
    }
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous preview to avoid leaking object URLs
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview);
        } catch (err) {
          /* ignore */
        }
      }
      setPhotoFile(file);
      const tmpUrl = URL.createObjectURL(file);
      setPhotoPreview(tmpUrl); // Creates a temporary preview URL
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      alert("Please select a photo first.");
      return;
    }

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      // Configure headers with authentication
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      // Upload photo to backend
      const res = await axios.post(
        `${baseUrl}/api/v1/students/${id}/photo`,
        formData,
        config,
      );
      const returned = res.data;
      console.log("Photo upload response:", returned);

      // Extract photo URL from response
      const returnedPhotoUrl =
        returned?.photo_url || returned?.photoUrl || null;

      if (returnedPhotoUrl) {
        // Update student state with new photo URL
        setStudent((prev) => ({
          ...(prev || {}),
          photoUrl: returnedPhotoUrl,
          photo_url: returnedPhotoUrl,
        }));

        showToast("Photo uploaded and saved successfully!", "success");
      } else {
        console.warn(
          "Photo uploaded but server did not return photo_url/photoUrl:",
          returned,
        );
        alert("Photo uploaded but URL not returned. Please refresh the page.");
      }

      // Clear the file input element
      if (fileInputRef?.current) {
        fileInputRef.current.value = null;
      }

      // Clean up preview and file state
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview);
        } catch (err) {
          console.warn("Error revoking preview URL:", err);
        }
      }
      setPhotoFile(null);
      setPhotoPreview(null);

      // Refresh student data to ensure everything is in sync
      await fetchStudent();
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload photo.";
      showToast(`Failed to upload photo: ${errorMessage}`, "error");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Document upload handlers
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Only PDF files are allowed", "error");
        if (documentInputRef.current) documentInputRef.current.value = null;
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(
          `File size exceeds 5MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          "error",
        );
        if (documentInputRef.current) documentInputRef.current.value = null;
        return;
      }

      setDocumentFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      alert("Please select a PDF document first.");
      return;
    }

    setDocumentUploading(true);
    const formData = new FormData();
    formData.append("file", documentFile);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const res = await axios.post(
        `${baseUrl}/api/v1/students/${id}/documents`,
        formData,
        config,
      );
      console.log("Document upload response:", res.data);

      showToast(
        `Document "${documentFile.name}" uploaded successfully!`,
        "success",
      );

      // Clear file input
      if (documentInputRef?.current) {
        documentInputRef.current.value = null;
      }
      setDocumentFile(null);

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload document.";
      showToast(`Failed to upload document: ${errorMessage}`, "error");
    } finally {
      setDocumentUploading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents`,
        config,
      );
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
      const document = res.data;

      // Convert base64 to blob and download
      const base64Data = document.file_data.split(",")[1] || document.file_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast(
        `Document "${documentName}" downloaded successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Error downloading document:", error);
      showToast("Failed to download document.", "error");
    }
  };

  const handleViewDocument = async (documentId, documentName) => {
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
      const document = res.data;

      // Convert base64 to blob and open in new tab
      const base64Data = document.file_data.split(",")[1] || document.file_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up after a delay to allow the browser to open it
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error viewing document:", error);
      showToast("Failed to view document.", "error");
    }
  };

  const handleDeleteDocument = async (documentId, documentName) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      await axios.delete(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
      showToast(`Document "${documentName}" deleted successfully!`, "success");

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("Failed to delete document.", "error");
    }
  };

  // In StudentPage.js -> fetchStudent()

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const { data } = await axios.get(`${baseUrl}/api/v1/students/${id}`);
      console.debug("fetchStudent: raw API response for student", data);

      // --- REPLACE your old mapping object with this new one ---
      const mappedForDisplay = {
        // == Core & Academic ==
        name: data.name,
        age: data.age,
        studentId: data.student_id,
        dob: data.dob,
        gender: data.gender,
        class: data.class_name,
        rollNo: data.roll_no,
        academicYear: data.academic_year,
        admissionNumber: data.admission_number,
        admissionDate: data.admission_date,
        classTeacher: data.class_teacher,

        // == Personal & Contact ==
        religion: data.religion,
        caste: data.caste,
        category: data.category,
        bloodGroup: data.blood_group,
        aadharNumber: formatAadhaar(data.aadhar_number),
        phoneNumber: data.phone_number,
        email: data.email,

        // == Address ==
        birthPlace: data.birth_place,
        houseName: data.house_name,
        streetName: data.street_name,
        postOffice: data.post_office,
        pinCode: data.pin_code,
        revenueDistrict: data.revenue_district,
        blockPanchayat: data.block_panchayat,
        localBody: data.local_body,
        taluk: data.taluk,
        address: [data.house_name, data.street_name, data.post_office]
          .filter(Boolean)
          .join(", "),
        address_and_phone: data.address_and_phone,

        // == Family Info ==
        fatherName: data.father_name,
        fatherEducation: data.father_education,
        fatherOccupation: data.father_occupation,
        motherName: data.mother_name,
        motherEducation: data.mother_education,
        motherOccupation: data.mother_occupation,
        guardianName: data.guardian_name,
        guardianOccupation: data.guardian_occupation,
        guardianRelationship: data.guardian_relationship,
        guardianContact: data.guardian_contact,
        totalFamilyIncome: data.total_family_income,

        // == Bank Details ==
        bankName: data.bank_name,
        accountNumber: data.account_number,
        branch: data.branch,
        ifscCode: data.ifsc_code
          ? String(data.ifsc_code).toUpperCase()
          : data.ifsc_code,

        // == Medical & ID ==
        disabilityType: data.disability_type,
        disabilityPercentage: data.disability_percentage,
        identificationMarks: data.identification_marks,
        photoUrl: data.photo_url,
        specific_diagnostic: data.specific_diagnostic,
        medical_conditions: data.medical_conditions,
        is_on_regular_drugs: data.is_on_regular_drugs,
        allergies: data.allergies,
        drug_allergy: data.drug_allergy,
        food_allergy: data.food_allergy,
        // Raw drug history array from the API (array of {name, dose})
        drug_history: data.drug_history || [],
        // Household composition array from the API
        household: data.household || [],

        // == Case Record Fields ==
        informantName: data.informant_name,
        informantRelationship: data.informant_relationship,
        durationOfContact: data.duration_of_contact,
        presentComplaints: data.present_complaints,
        previousTreatments: data.previous_treatments,

        // Re-structured for simplicity
        familyHistory: {
          mental_illness: data.family_history_mental_illness,
          mental_retardation: data.family_history_mental_retardation,
          epilepsy: data.family_history_epilepsy,
        },
        birthHistory: {
          prenatal: data.prenatal_history,
          natal: data.natal_history,
          postnatal: data.postnatal_history,
        },
        developmentHistory: {
          smiles_at_other: data.smiles_at_other,
          head_control: data.head_control,
          sitting: data.sitting,
          responds_to_name: data.responds_to_name,
          babbling: data.babbling,
          first_words: data.first_words,
          standing: data.standing,
          walking: data.walking,
          two_word_phrases: data.two_word_phrases,
          toilet_control: data.toilet_control,
          sentences: data.sentences,
          physical_deformity: data.physical_deformity,
        },
        additionalInfo: {
          // You can map these individually if you prefer
          school_history: data.school_history,
          occupational_history: data.occupational_history,
          behaviour_problems: data.behaviour_problems,
        },
        // Build a nested assessment object from flat DB fields so the UI can read it
        assessment: {
          self_help: {
            food_habits: {
              eating: data.eating_habits,
              drinking: data.drinking_habits,
            },
            toilet_habits: data.toilet_habits,
            brushing: data.brushing,
            bathing: data.bathing,
            dressing: {
              removing_and_wearing: data.dressing_removing_wearing,
              buttoning: data.dressing_buttoning,
              footwear: data.dressing_footwear,
              grooming: data.dressing_grooming,
            },
          },
          motor: {
            gross_motor: data.gross_motor,
            fine_motor: data.fine_motor,
          },
          sensory: data.sensory,
          socialization: {
            language_communication: data.language_communication,
            social_behaviour: data.social_behaviour,
            mobility: data.mobility_in_neighborhood,
          },
          cognitive: {
            attention: data.attention,
            identification_of_objects: data.identification_of_objects,
            use_of_objects: data.use_of_objects,
            following_instruction: data.following_instruction,
            awareness_of_danger: data.awareness_of_danger,
            concept_formation: {
              color: data.concept_color,
              size: data.concept_size,
              sex: data.concept_sex,
              shape: data.concept_shape,
              number: data.concept_number,
              time: data.concept_time,
              money: data.concept_money,
            },
          },
          academic: {
            reading: data.academic_reading,
            writing: data.academic_writing,
            arithmetic: data.academic_arithmetic,
          },
          prevocational: {
            ability_and_interest: data.prevocational_ability,
            items_of_interest: data.prevocational_interest,
            items_of_dislike: data.prevocational_dislike,
          },
          behaviour_problems: data.behaviour_problems,
          any_other: data.any_other,
          recommendation: data.recommendation,
        },
      };

      // After mapping student, fetch therapy reports for this student
      try {
        // backend endpoint expects numeric DB id, use data.id if available, otherwise fallback to route id
        fetchReports(data.id || id);
      } catch (err) {
        console.warn("Could not fetch reports after student load", err);
      }

      setStudent(mappedForDisplay);
      const { studentId, photoUrl, address, ...editableFields } =
        mappedForDisplay;
      setEditData(editableFields);
    } catch (e) {
      setStudent(null);
      console.error("Failed to fetch student data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch therapy reports for a student id
  const fetchReports = async (studentId) => {
    try {
      setReportsLoading(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const { data } = await axios.get(
        `${baseUrl}/api/v1/therapy-reports/student/${studentId}`,
        config,
      );
      // data is expected to be an array of reports
      const list = Array.isArray(data) ? data : [];
      // sort by report_date desc
      list.sort((a, b) =>
        (b.report_date || b.created_at || "").localeCompare(
          a.report_date || a.created_at || "",
        ),
      );
      setReports(list);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      if (typeof window === "undefined") return;
      const key = `special-education-tables:${id}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((t) => ({
          ...t,
          // default: tables from previous sessions are read-only
          isEditable: t.isEditable === true,
          // Set to the highest filled phase instead of just using saved value
          assessment_phase: getHighestFilledPhase(t),
          last_edited_at: t.last_edited_at || null,
        }));
        setSavedTables(normalized);
      }
    } catch (err) {
      console.warn("Failed to load saved Special Education tables", err);
    }
  }, [id]);

  // Load IEP data when component mounts or student ID changes
  useEffect(() => {
    if (id) {
      loadIepData();
    }
  }, [id]);

  // OCR Image Upload Handlers
  const handleOcrImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/bmp",
        "image/tiff",
      ];
      if (!validTypes.includes(file.type)) {
        setOcrError(
          "Invalid file type. Please upload a JPG, PNG, BMP, or TIFF image.",
        );
        if (fileInputRef.current) fileInputRef.current.value = null;
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setOcrError(
          `File size exceeds 10MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        );
        if (fileInputRef.current) fileInputRef.current.value = null;
        return;
      }

      setOcrImage(file);
      setOcrError(null);
    }
  };

  // Core OCR upload function that accepts a file
  const handleOcrUploadWithFile = async (file) => {
    if (!file) {
      setOcrError("No image file provided.");
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const res = await axios.post(
        `${baseUrl}/api/v1/students/upload-report`,
        formData,
        config,
      );
      const data = res.data;

      if (data.success && data.tables && data.tables.length > 0) {
        const extractedAt = new Date().toISOString();

        // Enrich every table once
        const datedTables = data.tables.map((t) => ({
          ...t,
          report_date: reportDate || null,
          extracted_at: t.extracted_at || extractedAt,
          isEditable: true, // newly extracted tables are editable + show Save
          assessment_phase: "1st assmt", // default: converted image = 1st assessment
          last_edited_at: extractedAt, // first “edit” time = extraction
        }));

        // Use enriched tables for current session
        setExtractedTables(datedTables);
        setOcrMethod(data.method);
        setExtractionData(data.extracted_data || null);
        setExtractionSummary(data.extraction_summary || null);

        // Persist enriched tables in history
        try {
          const key = `special-education-tables:${id}`;
          setSavedTables((prev) => {
            const updated = [...prev, ...datedTables];
            if (typeof window !== "undefined") {
              window.localStorage.setItem(key, JSON.stringify(updated));
            }
            return updated;
          });
        } catch (err) {
          console.warn("Failed to save Special Education tables history", err);
        }

        // Show temporary notification
        setExtractionNotification({
          tableCount: data.tables.length,
          method: data.method || "Unknown",
        });

        // Auto-hide after 4 seconds
        setTimeout(() => {
          setExtractionNotification(null);
        }, 4000);
      } else {
        setOcrError(
          "No tables detected in the image. Please try a different image or adjust the crop area.",
        );
        showToast("No tables detected in the image.", "warning");
      }
    } catch (error) {
      console.error("OCR upload error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to process image.";
      setOcrError(`OCR failed: ${errorMessage}`);
      showToast(`OCR failed: ${errorMessage}`, "error");
    } finally {
      setOcrLoading(false);
    }
  };

  // Wrapper for manual extract button (uses already selected image)
  const handleOcrUpload = async () => {
    if (!ocrImage) {
      setOcrError("Please select an image first.");
      return;
    }
    if (!reportDate) {
      setOcrError("Please enter the report date.");
      return;
    }
    await handleOcrUploadWithFile(ocrImage);
  };

  const handleClearOcrData = () => {
    setOcrImage(null);
    setExtractedTables([]);
    setOcrError(null);
    setOcrMethod(null);
    setExtractionData(null);
    setExtractionSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // Helper function to format dates in a human-friendly way (no seconds)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return (
      date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const handleSetTableEditable = (targetTable, editable) => {
    setSavedTables((prev) => {
      const nowIso = !editable ? new Date().toISOString() : null;

      const updated = prev.map((t) => {
        if (t !== targetTable) return t;
        return {
          ...t,
          isEditable: editable,
          // only stamp when saving (editable=false)
          last_edited_at: !editable ? nowIso : t.last_edited_at || nowIso,
        };
      });

      try {
        if (typeof window !== "undefined" && id) {
          const key = `special-education-tables:${id}`;
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist table edit state", err);
      }

      return updated;
    });
  };

  const handleDeleteTable = (viewIndex) => {
    setSavedTables((prev) => {
      // Reproduce the same sort used in the JSX
      const sorted = [...prev].sort((a, b) => {
        const da = new Date(a.report_date || a.extracted_at || 0);
        const db = new Date(b.report_date || b.extracted_at || 0);
        return db - da; // newest first
      });
      const tableToDelete = sorted[viewIndex];
      const updated = prev.filter((t) => t !== tableToDelete);

      try {
        if (typeof window !== "undefined" && id) {
          const key = `special-education-tables:${id}`;
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist deleted table list", err);
      }

      return updated;
    });

    // keep extractedTables in sync for current session
    setExtractedTables((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const da = new Date(a.report_date || a.extracted_at || 0);
        const db = new Date(b.report_date || b.extracted_at || 0);
        return db - da;
      });
      const tableToDelete = sorted[viewIndex];
      return prev.filter((t) => t !== tableToDelete);
    });
  };

  const handleExportToCSV = (table, index) => {
    if (!table || !table.rows || table.rows.length === 0) return;

    // Get student name from first row (if exists) before filtering
    const studentName =
      table.rows[0] && table.rows[0]["Student Name"]
        ? table.rows[0]["Student Name"]
        : "";

    // Filter out Student Name and Register Number columns from headers
    const allHeaders = table.headers || Object.keys(table.rows[0]);
    const headers = allHeaders
      .filter(
        (h) =>
          h !== "Student Name" &&
          h !== "Register Number" &&
          h !== "Assessment Date",
      )
      .map((h) => h.replace(/^Session\s+/i, ""));

    // Add student name as a comment line at the top if it exists
    const csvRows = [];
    if (studentName) {
      csvRows.push(`# Student: ${studentName}`);
    }
    csvRows.push(headers.join(","));

    table.rows.forEach((row) => {
      const values = allHeaders
        .filter(
          (h) =>
            h !== "Student Name" &&
            h !== "Register Number" &&
            h !== "Assessment Date",
        )
        .map((header) => {
          const value = row[header] || "";
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
        });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `table_${index + 1}_${new Date().getTime()}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Table exported to CSV successfully!", "success");
  };

  // Download Profile as PDF (screenshot)
  // REPLACE your existing function with this one
  // REPLACE your existing function with this one
  const handleDownloadProfile = async () => {
    if (!student) return;

    const doc = new jsPDF();
    let y = 15;
    const leftCol = 20;
    const boxX = 87;
    const boxWidth = 105;
    const boxHeight = 8;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    const checkPageBreak = () => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    }; // --- PDF Header ---

    const imgWidth = 40;
    const imgHeight = 50;
    const imgX = pageWidth - imgWidth - leftCol;
    const imgY = 30;
    doc.setDrawColor(0);
    doc.rect(imgX, imgY, imgWidth, imgHeight);
    if (student.photoUrl) {
      try {
        doc.addImage(student.photoUrl, "JPEG", imgX, imgY, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error adding image to PDF:", e);
      }
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ST. MARTHA'S SPECIAL SCHOOL", pageWidth / 2, y + 5, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("FOR THE MENTALLY CHALLENGED", pageWidth / 2, y + 12, {
      align: "center",
    });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT RECORD FORM", pageWidth / 2, y + 25, { align: "center" });
    y = Math.max(y + 25, imgY + imgHeight) + 5; // --- End Header ---
    const drawField = (label, value) => {
      // Multiline-aware field renderer. Calculates needed box height based on
      // wrapped text and prevents page overflow.
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const text = String(value || "");
      const maxTextWidth = boxWidth - 4; // padding inside box
      const lines = text ? doc.splitTextToSize(text, maxTextWidth) : [""];
      const lineHeight = 6;
      const neededHeight = Math.max(boxHeight, lines.length * lineHeight + 4);

      // If the field won't fit on the current page, start a new page
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Label on the left
      doc.text(String(label || ""), leftCol, y + 6);
      // Draw box sized for content
      const boxY = y;
      doc.rect(boxX, boxY, boxWidth, neededHeight);

      // Write wrapped text inside the box
      let textY = boxY + 6; // first line baseline
      lines.forEach((ln) => {
        doc.text(ln, boxX + 2, textY);
        textY += lineHeight;
      });

      y += neededHeight + 6;
    };

    const drawSectionHeader = (title) => {
      checkPageBreak();
      y += 5;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftCol, y);
      y += 8;
    };

    drawSectionHeader("Personal Information");
    drawField("NAME OF THE STUDENT", student.name);
    drawField("AGE", student.age);
    drawField("DATE OF BIRTH", student.dob);
    drawField("GENDER", student.gender);
    drawField("RELIGION", student.religion);
    drawField("CASTE", student.caste);
    drawField("AADHAR NUMBER", student.aadharNumber); // <-- ADDED

    drawSectionHeader("Address Information");
    drawField("BIRTH PLACE", student.birthPlace);
    drawField("HOUSE NAME", student.houseName);
    drawField("STREET NAME", student.streetName);
    drawField("POST OFFICE", student.postOffice);
    drawField("PIN CODE", student.pinCode);
    drawField("REVENUE DISTRICT", student.revenueDistrict);
    drawField("BLOCK PANCHAYAT", student.blockPanchayat);
    drawField("LOCAL BODY", student.localBody);
    drawField("TALUK", student.taluk);

    drawSectionHeader("Contact Information");
    drawField("PHONE NUMBER", student.phoneNumber);
    drawField("EMAIL", student.email);
    drawField("ADDRESS", student.address);

    drawSectionHeader("Family Information");
    drawField("FATHER NAME", student.fatherName); // We will only include the names as per your previous change
    drawField("MOTHER NAME", student.motherName); // --- vvv NEWLY ADDED SECTIONS vvv ---

    drawSectionHeader("Disability Details");
    drawField("TYPE OF DISABILITY", student.disabilityType);
    drawField(
      "PERCENTAGE",
      student.disabilityPercentage ? `${student.disabilityPercentage}%` : "",
    );

    drawSectionHeader("Identification Marks");
    drawField("MARKS", student.identificationMarks); // --- ^^^ END OF NEW SECTIONS ^^^ ---
    drawSectionHeader("Academic Information");
    drawField("CLASS", student.class);
    drawField("ROLL NUMBER", student.rollNo);
    drawField("ACADEMIC YEAR", student.academicYear);
    drawField("ADMISSION NUMBER", student.admissionNumber);
    drawField("DATE OF ADMISSION", student.admissionDate);
    drawField("CLASS TEACHER", student.classTeacher);

    drawSectionHeader("Bank Details");
    drawField("BANK NAME", student.bankName);
    drawField("ACCOUNT NUMBER", student.accountNumber);
    drawField("BRANCH", student.branch);
    drawField("IFSC CODE", student.ifscCode);

    doc.save(`Student_Profile_${student.name || "profile"}.pdf`);
  };

  // Download CASE RECORD only (same template style but restricted fields)
  const handleDownloadCaseRecord = async () => {
    if (!student) return;

    const doc = new jsPDF();
    let y = 20; // Initial y position

    // --- Document Constants ---
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth =
      doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
    const labelColumnWidth = 60; // Width for the label/title part
    const valueColumnX = leftMargin + labelColumnWidth + 5;
    const valueColumnWidth = contentWidth - labelColumnWidth - 5;
    const defaultBoxHeight = 8;
    const lineHeight = 6;
    const fieldGap = 5; // Vertical gap between fields
    const sectionGap = 8; // Vertical gap after a section header

    // --- Helper Functions ---

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    const drawSectionHeader = (title) => {
      checkPageBreak(20); // Check if header fits
      y += sectionGap;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftMargin, y);
      y += sectionGap;
      doc.setFont("helvetica", "normal");
    };

    const drawSubHeader = (title) => {
      checkPageBreak(15);
      y += 4;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftMargin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
    };

    const drawField = (label, value) => {
      const text = String(value || "N/A");
      const lines = doc.splitTextToSize(text, valueColumnWidth - 4);
      const neededHeight = Math.max(
        defaultBoxHeight,
        lines.length * lineHeight + 4,
      );

      checkPageBreak(neededHeight + fieldGap);

      // Draw Label
      doc.setFontSize(11);
      doc.text(label, leftMargin, y + 6);

      // Draw Value Box
      doc.rect(valueColumnX, y, valueColumnWidth, neededHeight);

      // Draw Value Text (multiline)
      let textY = y + 6;
      lines.forEach((line) => {
        doc.text(line, valueColumnX + 2, textY);
        textY += lineHeight;
      });

      y += neededHeight + fieldGap;
    };

    // --- PDF Generation Starts Here ---

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CASE RECORD", doc.internal.pageSize.getWidth() / 2, y, {
      align: "center",
    });
    y += 15;

    // 1. Identification Data
    drawSectionHeader("Identification Data");
    drawField("Name of Student", student.name);
    drawField("Admission Number", student.admissionNumber);
    drawField("Date of Birth", student.dob);
    drawField("Age", student.age);
    drawField("Gender", student.gender);
    drawField("Education", student.class);
    drawField("Blood Group", student.bloodGroup);
    drawField("Religion", student.religion);
    drawField("Category", student.category);
    drawField("Aadhar Number", student.aadharNumber);

    // 2. Demographic Data
    drawSectionHeader("Demographic Data");
    drawField("Father's Name", student.fatherName);
    drawField("Father's Education", student.fatherEducation);
    drawField("Father's Occupation", student.fatherOccupation);
    drawField("Mother's Name", student.motherName);
    drawField("Mother's Education", student.motherEducation);
    drawField("Mother's Occupation", student.motherOccupation);
    drawField("Guardian's Name", student.guardianName);
    drawField("Guardian's Relationship", student.guardianRelationship);
    drawField("Guardian's Occupation", student.guardianOccupation);
    drawField("Total Family Income", student.totalFamilyIncome);
    drawField(
      "Address & Phone",
      student.address_and_phone ||
        `${student.address || ""}${student.phoneNumber ? " | " + student.phoneNumber : ""}`,
    );

    // 3. Informant Detail
    drawSectionHeader("Informant Detail");
    drawField("Informant Name", student.informantName);
    drawField("Informant Relationship", student.informantRelationship);
    drawField("Duration of Contact", student.durationOfContact);
    drawField("Present Complaints", student.presentComplaints);
    drawField(
      "Previous Consultation and Treatments",
      student.previousTreatments,
    );

    // 4. Family History
    drawSectionHeader("Family History");
    drawField("Mental Illness", student.familyHistory?.mental_illness);
    drawField("Mental Retardation", student.familyHistory?.mental_retardation);
    drawField("Epilepsy and Others", student.familyHistory?.epilepsy);

    // 5. Birth History
    drawSectionHeader("Birth History");
    drawField("Prenatal History", student.birthHistory?.prenatal);
    drawField("Natal / Neonatal History", student.birthHistory?.natal);
    drawField("Postnatal History", student.birthHistory?.postnatal);

    // 6. Developmental History
    drawSectionHeader("Developmental History");
    const dev = student.developmentHistory || {};
    const yesNo = (v) => (v ? "Yes" : "No");
    drawField("Smiles at others", yesNo(dev.smiles_at_other));
    drawField("Head control", yesNo(dev.head_control));
    drawField("Sitting", yesNo(dev.sitting));
    drawField("Responds to name", yesNo(dev.responds_to_name));
    drawField("Babbling", yesNo(dev.babbling));
    drawField("First words", yesNo(dev.first_words));
    drawField("Standing", yesNo(dev.standing));
    drawField("Walking", yesNo(dev.walking));
    drawField("Two-word phrases", yesNo(dev.two_word_phrases));
    drawField("Toilet control", yesNo(dev.toilet_control));
    drawField("Sentences", yesNo(dev.sentences));
    drawField("Physical deformity", yesNo(dev.physical_deformity));

    // 7. Special Education Assessment
    drawSectionHeader("Special Education Assessment");
    const assessment = student.assessment || {};

    drawSubHeader("Self Help / ADL");
    drawField("Eating Habits", assessment.self_help?.food_habits?.eating);
    drawField("Drinking Habits", assessment.self_help?.food_habits?.drinking);
    drawField("Toilet Habits", assessment.self_help?.toilet_habits);
    drawField("Brushing", assessment.self_help?.brushing);
    drawField("Bathing", assessment.self_help?.bathing);
    drawField(
      "Dressing (Removing/Wearing)",
      assessment.self_help?.dressing?.removing_and_wearing,
    );
    drawField(
      "Dressing (Buttoning)",
      assessment.self_help?.dressing?.buttoning,
    );
    drawField("Dressing (Footwear)", assessment.self_help?.dressing?.footwear);
    drawField("Grooming", assessment.self_help?.dressing?.grooming);

    drawSubHeader("Motor");
    drawField("Gross Motor", assessment.motor?.gross_motor);
    drawField("Fine Motor", assessment.motor?.fine_motor);

    drawSubHeader("Sensory");
    drawField("Sensory Skills", assessment.sensory);

    drawSubHeader("Socialization");
    drawField(
      "Language/Communication",
      assessment.socialization?.language_communication,
    );
    drawField("Social Behaviour", assessment.socialization?.social_behaviour);
    drawField("Mobility in Neighborhood", assessment.socialization?.mobility);

    drawSubHeader("Cognitive");
    drawField("Attention", assessment.cognitive?.attention);
    drawField(
      "Identification of Objects",
      assessment.cognitive?.identification_of_objects,
    );
    drawField("Use of Objects", assessment.cognitive?.use_of_objects);
    drawField(
      "Following Instruction",
      assessment.cognitive?.following_instruction,
    );
    drawField("Awareness of Danger", assessment.cognitive?.awareness_of_danger);
    drawField(
      "Concept - Color",
      assessment.cognitive?.concept_formation?.color,
    );
    drawField("Concept - Size", assessment.cognitive?.concept_formation?.size);
    drawField("Concept - Sex", assessment.cognitive?.concept_formation?.sex);
    drawField(
      "Concept - Shape",
      assessment.cognitive?.concept_formation?.shape,
    );
    drawField(
      "Concept - Number",
      assessment.cognitive?.concept_formation?.number,
    );
    drawField("Concept - Time", assessment.cognitive?.concept_formation?.time);
    drawField(
      "Concept - Money",
      assessment.cognitive?.concept_formation?.money,
    );

    drawSubHeader("Academic");
    drawField("Reading", assessment.academic?.reading);
    drawField("Writing", assessment.academic?.writing);
    drawField("Arithmetic", assessment.academic?.arithmetic);

    drawSubHeader("Prevocational / Domestic");
    drawField(
      "Ability & Interest",
      assessment.prevocational?.ability_and_interest,
    );
    drawField("Items of Interest", assessment.prevocational?.items_of_interest);
    drawField("Items of Dislike", assessment.prevocational?.items_of_dislike);

    drawSubHeader("Observations & Recommendations");
    drawField("Behaviour Problems", assessment.behaviour_problems);
    drawField("Any Other Information", assessment.any_other);
    drawField("Recommendation", assessment.recommendation);

    // 8. Medical, Allergies & Drug History
    drawSectionHeader("Medical, Allergies & Drug History");
    drawField("Medical conditions", student.medical_conditions);
    drawField("Specific diagnostic", student.specific_diagnostic);
    drawField(
      "Is on regular drugs",
      student.is_on_regular_drugs ? "Yes" : "No",
    );
    drawField("Drug allergy", student.drug_allergy);
    drawField("Food allergy", student.food_allergy);

    if (
      Array.isArray(student.drug_history) &&
      student.drug_history.length > 0
    ) {
      drawSubHeader("Drug History Details");
      student.drug_history.forEach((drug, idx) => {
        drawField(
          `Drug ${idx + 1}: ${drug.name || "Unnamed"}`,
          `Dose: ${drug.dose || "N/A"}`,
        );
      });
    }

    // Save with a clean filename
    const safeName = (student.name || "student").replace(/[^a-z0-9_-]/gi, "_");
    doc.save(`case-record_${safeName}.pdf`);
  };

  // Generate and download therapy summary report
  const handleGenerateSummaryReport = () => {
    if (!student) {
      alert("Student information not available. Please try again.");
      return;
    }

    if (generatingReport) {
      return; // Prevent multiple concurrent generations
    }

    // Validate date range
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      alert(
        "Start date cannot be later than end date. Please check your date selection.",
      );
      return;
    }

    setGeneratingReport(true);

    // Filter reports based on current filters
    const filtered = reports.filter((r) => {
      if (fromDate) {
        if (!r.report_date || new Date(r.report_date) < new Date(fromDate))
          return false;
      }
      if (toDate) {
        if (!r.report_date || new Date(r.report_date) > new Date(toDate))
          return false;
      }
      if (selectedTherapyType) {
        if (!r.therapy_type || r.therapy_type !== selectedTherapyType)
          return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      const filterDescription = [];
      if (fromDate) filterDescription.push(`start date: ${fromDate}`);
      if (toDate) filterDescription.push(`end date: ${toDate}`);
      if (selectedTherapyType)
        filterDescription.push(`therapy type: ${selectedTherapyType}`);

      const filterText =
        filterDescription.length > 0
          ? ` matching the selected criteria (${filterDescription.join(", ")})`
          : "";

      alert(
        `No therapy reports found${filterText}. Please adjust your filters or ensure therapy reports exist for this student.`,
      );
      setGeneratingReport(false);
      return;
    }

    try {
      const doc = new jsPDF();
      let y = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      const rightMargin = 15;
      const contentWidth =
        doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
      const lineHeight = 6;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const addText = (text, fontSize = 10, isBold = false) => {
        checkPageBreak(lineHeight + 2);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, y);
          y += lineHeight;
        });
        y += 2; // Extra spacing
      };

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(
        "THERAPY SUMMARY REPORT",
        doc.internal.pageSize.getWidth() / 2,
        y,
        { align: "center" },
      );
      y += 15;

      // Student Info
      addText(`Student Name: ${student.name || "N/A"}`, 12, true);
      addText(`Student ID: ${student.studentId || "N/A"}`, 10);
      addText(`Report Generated: ${new Date().toLocaleDateString()}`, 10);

      // Filter criteria
      y += 5;
      addText("Filter Criteria:", 12, true);
      if (fromDate) addText(`Start Date: ${fromDate}`, 10);
      if (toDate) addText(`End Date: ${toDate}`, 10);
      if (selectedTherapyType)
        addText(`Therapy Type: ${selectedTherapyType}`, 10);
      addText(`Total Reports: ${filtered.length}`, 10);

      y += 10;
      addText("SUMMARY OF THERAPY REPORTS", 14, true);
      y += 5;

      // Group reports by therapy type for summary
      const reportsByType = {};
      filtered.forEach((r) => {
        const type = r.therapy_type || "Unspecified";
        if (!reportsByType[type]) {
          reportsByType[type] = [];
        }
        reportsByType[type].push(r);
      });

      // Summary by therapy type
      Object.entries(reportsByType).forEach(([type, typeReports]) => {
        addText(`${type} (${typeReports.length} sessions)`, 12, true);
        y += 3;

        typeReports.forEach((report, index) => {
          addText(
            `Session ${index + 1} - ${new Date(report.report_date).toLocaleDateString()}`,
            11,
            true,
          );
          if (report.progress_level) {
            addText(`Progress Level: ${report.progress_level}`, 10);
          }

          // Display goals_achieved sections properly
          if (report.goals_achieved) {
            if (
              typeof report.goals_achieved === "object" &&
              !Array.isArray(report.goals_achieved)
            ) {
              // If it's an object with sections
              addText("Goals Achieved:", 10, true);
              Object.entries(report.goals_achieved).forEach(
                ([sectionKey, sectionData]) => {
                  // Format section title (e.g., "receptive_language" -> "Receptive Language")
                  const sectionTitle = sectionKey
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  if (typeof sectionData === "object" && sectionData.notes) {
                    addText(`  ${sectionTitle}: ${sectionData.notes}`, 9);
                  } else if (typeof sectionData === "string") {
                    addText(`  ${sectionTitle}: ${sectionData}`, 9);
                  }
                },
              );
            } else {
              // If it's a simple string
              addText(`Goals Achieved: ${report.goals_achieved}`, 10);
            }
          }
          y += 5;
        });
        y += 5;
      });

      // Generate filename
      const dateRange =
        fromDate && toDate
          ? `_${fromDate}_to_${toDate}`
          : fromDate
            ? `_from_${fromDate}`
            : toDate
              ? `_to_${toDate}`
              : "";
      const therapyTypeStr = selectedTherapyType
        ? `_${selectedTherapyType.replace(/\s+/g, "_")}`
        : "";
      const safeName = (student.name || "student").replace(
        /[^a-z0-9_-]/gi,
        "_",
      );

      doc.save(`therapy_summary_${safeName}${dateRange}${therapyTypeStr}.pdf`);
      setShowSummary(false);
      setGeneratingReport(false);
    } catch (error) {
      console.error("Error generating therapy summary report:", error);
      alert("An error occurred while generating the report. Please try again.");
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">
          Loading student information...
        </div>
      </div>
    );
  }

  return (
    <div
      id="profile-to-download"
      className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20"
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[9999] animate-slide-in-right ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}
        >
          <div className="flex-shrink-0">
            {toast.type === "success" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : toast.type === "error" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-8 left-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Student Information
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative w-[925px]">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left:
                  activeTab === "student-details"
                    ? "4px"
                    : activeTab === "case-record"
                      ? "188px"
                      : activeTab === "therapy-reports"
                        ? "372px"
                        : activeTab === "iep"
                          ? "556px"
                          : "740px",
                width: "180px",
                background: "linear-gradient(135deg, #E38B52 0%, #E38B52 100%)",
              }}
            >
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="particle-1"></div>
                <div className="particle-2"></div>
                <div className="particle-3"></div>
              </div>
            </div>

            {/* Student Details Tab */}
            <button
              onClick={() => setActiveTab("student-details")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "student-details"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Student Details
            </button>

            {/* Case Record Tab */}
            <button
              onClick={() => setActiveTab("case-record")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "case-record"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Case Record
            </button>

            {/* Therapy Reports Tab */}
            <button
              onClick={() => setActiveTab("therapy-reports")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "therapy-reports"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Therapy Reports
            </button>
            {/* IEP Tab */}
            <button
              onClick={() => setActiveTab("iep")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "iep"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              IEP
            </button>

            {/* Special Education Tab */}
            <button
              onClick={() => setActiveTab("special-education")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "special-education"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Special Education
            </button>
          </div>
        </div>

        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "therapy-reports" ? (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-[#E38B52]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
                  />
                </svg>
                Therapy Reports
              </h2>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Center: AI Analysis Expanded */}
                <main className="w-full lg:w-4/6 flex-1 lg:px-4">
                  <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                    {/* Horizontal filter bar at the top */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-end gap-6 mb-4 w-full">
                      <div className="flex flex-row items-center min-w-[140px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Start Date
                        </span>
                        <div className="relative flex items-center h-10">
                          <input
                            ref={startDateRef}
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                              setFromDate(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="appearance-none w-[36px] h-10 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-base text-gray-700 pl-9 pr-2 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            style={{ paddingLeft: "2.2rem" }}
                            aria-label="Start date"
                          />
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] focus:outline-none"
                            tabIndex={-1}
                            onClick={() =>
                              startDateRef.current &&
                              startDateRef.current.showPicker &&
                              startDateRef.current.showPicker()
                            }
                            aria-label="Open start date picker"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="white"
                              />
                              <path
                                d="M16 2v4M8 2v4M3 10h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-row items-center min-w-[140px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          End Date
                        </span>
                        <div className="relative flex items-center">
                          <input
                            ref={endDateRef}
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                              setToDate(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="appearance-none w-[36px] h-10 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-base text-gray-700 pl-9 pr-2 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            style={{ paddingLeft: "2.2rem" }}
                            aria-label="End date"
                          />
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] focus:outline-none"
                            tabIndex={-1}
                            onClick={() =>
                              endDateRef.current &&
                              endDateRef.current.showPicker &&
                              endDateRef.current.showPicker()
                            }
                            aria-label="Open end date picker"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="white"
                              />
                              <path
                                d="M16 2v4M8 2v4M3 10h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-row items-center min-w-[170px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Therapy
                        </span>
                        <div className="relative flex items-center h-10 w-full">
                          <select
                            value={selectedTherapyType}
                            onChange={(e) => {
                              setSelectedTherapyType(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="appearance-none w-full min-w-[110px] h-10 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-base text-gray-700 pl-9 pr-6 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            title="Filter by therapy type"
                            aria-label="Therapy type"
                          >
                            <option value="">All Types</option>
                            <option value="Behavioral Therapy">
                              Behavioral
                            </option>
                            <option value="Occupational Therapy">
                              Occupational
                            </option>
                            <option value="Physical Therapy">Physical</option>
                            <option value="Speech Therapy">Speech</option>
                          </select>
                          <svg
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-row items-end gap-2">
                        {(fromDate || toDate || selectedTherapyType) && (
                          <button
                            onClick={() => {
                              setFromDate("");
                              setToDate("");
                              setSelectedTherapyType("");
                              setVisibleCount(5);
                            }}
                            className="px-5 h-10 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-base font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
                          >
                            Clear
                          </button>
                        )}
                        {/* Stats Display with Count-up Animation (moved here) */}
                        {(() => {
                          // Calculate filtered reports based on current filters
                          const filteredReports = reports.filter((r) => {
                            if (fromDate) {
                              if (!r.report_date) return false;
                              const reportDate = new Date(r.report_date);
                              const filterFromDate = new Date(fromDate);
                              if (reportDate < filterFromDate) return false;
                            }
                            if (toDate) {
                              if (!r.report_date) return false;
                              const reportDate = new Date(r.report_date);
                              const filterToDate = new Date(toDate);
                              if (reportDate > filterToDate) return false;
                            }
                            if (selectedTherapyType) {
                              if (
                                !r.therapy_type ||
                                r.therapy_type.trim() !==
                                  selectedTherapyType.trim()
                              )
                                return false;
                            }
                            return true;
                          });
                          // Calculate days between dates
                          const daysBetween =
                            fromDate && toDate
                              ? Math.ceil(
                                  (new Date(toDate) - new Date(fromDate)) /
                                    (1000 * 60 * 60 * 24),
                                ) + 1
                              : 0;
                          const showStats =
                            filteredReports.length > 0 || (fromDate && toDate);
                          return (
                            showStats && (
                              <div className="flex items-center gap-2 ml-2">
                                {filteredReports.length > 0 && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                    <svg
                                      className="w-5 h-5 text-[#E38B52]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    <div className="text-gray-700">
                                      <div className="text-lg font-bold text-[#E38B52]">
                                        <CountUp
                                          end={filteredReports.length}
                                          duration={1500}
                                        />
                                      </div>
                                      <div className="text-xs font-medium text-gray-600">
                                        Reports
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {daysBetween > 0 && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                    <svg
                                      className="w-5 h-5 text-[#E38B52]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <div className="text-gray-700">
                                      <div className="text-lg font-bold text-[#E38B52]">
                                        <CountUp
                                          end={daysBetween}
                                          duration={1500}
                                        />
                                      </div>
                                      <div className="text-xs font-medium text-gray-600">
                                        Days
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 w-full mt-2">
                      <button
                        onClick={handleAISummarize}
                        disabled={aiSummarizing}
                        className={`flex-1 px-7 py-3 rounded-2xl text-white font-bold text-lg tracking-wide transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 border-2 border-[#E38B52] focus:ring-4 focus:ring-[#E38B52]/30 ${aiSummarizing ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#E38B52] to-[#D67A3F] hover:from-[#D67A3F] hover:to-[#C56930]"}`}
                      >
                        {aiSummarizing ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Analyzing with Llama 3.2 3B...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>Generate AI Analysis</span>
                          </>
                        )}
                      </button>
                      {reports.length > 0 && (
                        <button
                          onClick={() => {
                            const filtered = reports.filter((r) => {
                              if (fromDate) {
                                if (!r.report_date) return false;
                                const reportDate = new Date(r.report_date);
                                const filterFromDate = new Date(fromDate);
                                if (reportDate < filterFromDate) return false;
                              }
                              if (toDate) {
                                if (!r.report_date) return false;
                                const reportDate = new Date(r.report_date);
                                const filterToDate = new Date(toDate);
                                if (reportDate > filterToDate) return false;
                              }
                              if (selectedTherapyType) {
                                if (
                                  !r.therapy_type ||
                                  r.therapy_type.trim() !==
                                    selectedTherapyType.trim()
                                )
                                  return false;
                              }
                              return true;
                            });

                            const pdf = new jsPDF();
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight =
                              pdf.internal.pageSize.getHeight();
                            const marginLeft = 15;
                            const marginRight = 15;
                            let yPosition = 20;

                            // Title
                            pdf.setFontSize(18);
                            pdf.setFont(undefined, "bold");
                            pdf.text(
                              `Therapy Reports - ${student?.name || "Student"}`,
                              marginLeft,
                              yPosition,
                            );
                            yPosition += 10;

                            // Date range
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, "normal");
                            const dateRangeText =
                              fromDate || toDate
                                ? `Date Range: ${fromDate || "Start"} to ${toDate || "End"}`
                                : "All Reports";
                            pdf.text(dateRangeText, marginLeft, yPosition);
                            yPosition += 5;

                            if (selectedTherapyType) {
                              pdf.text(
                                `Therapy Type: ${selectedTherapyType}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;
                            }

                            pdf.text(
                              `Total Reports: ${filtered.length}`,
                              marginLeft,
                              yPosition,
                            );
                            yPosition += 10;

                            // Reports
                            filtered.forEach((report, index) => {
                              if (yPosition > pageHeight - 40) {
                                pdf.addPage();
                                yPosition = 20;
                              }

                              pdf.setFontSize(14);
                              pdf.setFont(undefined, "bold");
                              pdf.text(
                                `Report ${index + 1}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 8;

                              pdf.setFontSize(10);
                              pdf.setFont(undefined, "normal");

                              pdf.text(
                                `Date: ${new Date(report.report_date).toLocaleDateString()}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              pdf.text(
                                `Therapy Type: ${report.therapy_type || "N/A"}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              pdf.text(
                                `Therapist: ${report.therapist_name || "N/A"}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              if (report.progress_level) {
                                pdf.text(
                                  `Progress Level: ${report.progress_level}`,
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                              }

                              yPosition += 3;

                              // Progress Notes
                              if (report.progress_notes) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Progress Notes:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const progressLines = pdf.splitTextToSize(
                                  report.progress_notes,
                                  pageWidth - marginLeft - marginRight,
                                );
                                progressLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Goals Achieved - detailed breakdown of all sections
                              if (report.goals_achieved) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Goals Achieved:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");

                                if (
                                  typeof report.goals_achieved === "object" &&
                                  !Array.isArray(report.goals_achieved)
                                ) {
                                  // Iterate through each section (e.g., receptive_language, expressive_language, etc.)
                                  Object.entries(report.goals_achieved).forEach(
                                    ([sectionKey, sectionData]) => {
                                      if (yPosition > pageHeight - 20) {
                                        pdf.addPage();
                                        yPosition = 20;
                                      }

                                      // Format section title (e.g., "receptive_language" -> "Receptive Language")
                                      const sectionTitle = sectionKey
                                        .split("_")
                                        .map(
                                          (word) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1),
                                        )
                                        .join(" ");

                                      pdf.setFont(undefined, "bold");
                                      pdf.text(
                                        `• ${sectionTitle}:`,
                                        marginLeft + 5,
                                        yPosition,
                                      );
                                      yPosition += 5;
                                      pdf.setFont(undefined, "normal");

                                      // Handle different data structures
                                      if (
                                        typeof sectionData === "object" &&
                                        sectionData !== null
                                      ) {
                                        // If it has a 'checked' property, show status
                                        if ("checked" in sectionData) {
                                          if (!sectionData.checked) {
                                            pdf.text(
                                              "No data entered",
                                              marginLeft + 10,
                                              yPosition,
                                            );
                                            yPosition += 5;
                                          }
                                        }

                                        // If it has notes, display them
                                        if (sectionData.notes) {
                                          const noteLines = pdf.splitTextToSize(
                                            `Notes: ${sectionData.notes}`,
                                            pageWidth -
                                              marginLeft -
                                              marginRight -
                                              15,
                                          );
                                          noteLines.forEach((line) => {
                                            if (yPosition > pageHeight - 20) {
                                              pdf.addPage();
                                              yPosition = 20;
                                            }
                                            pdf.text(
                                              line,
                                              marginLeft + 10,
                                              yPosition,
                                            );
                                            yPosition += 5;
                                          });
                                        }
                                      } else if (
                                        typeof sectionData === "string"
                                      ) {
                                        // Simple string value
                                        const dataLines = pdf.splitTextToSize(
                                          sectionData,
                                          pageWidth -
                                            marginLeft -
                                            marginRight -
                                            15,
                                        );
                                        dataLines.forEach((line) => {
                                          if (yPosition > pageHeight - 20) {
                                            pdf.addPage();
                                            yPosition = 20;
                                          }
                                          pdf.text(
                                            line,
                                            marginLeft + 10,
                                            yPosition,
                                          );
                                          yPosition += 5;
                                        });
                                      }

                                      yPosition += 2;
                                    },
                                  );
                                } else if (
                                  typeof report.goals_achieved === "string"
                                ) {
                                  // If goals_achieved is just a string
                                  const goalLines = pdf.splitTextToSize(
                                    report.goals_achieved,
                                    pageWidth - marginLeft - marginRight - 5,
                                  );
                                  goalLines.forEach((line) => {
                                    if (yPosition > pageHeight - 20) {
                                      pdf.addPage();
                                      yPosition = 20;
                                    }
                                    pdf.text(line, marginLeft + 5, yPosition);
                                    yPosition += 5;
                                  });
                                }
                                yPosition += 3;
                              }

                              // Challenges
                              if (report.challenges) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text("Challenges:", marginLeft, yPosition);
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const challengeLines = pdf.splitTextToSize(
                                  report.challenges,
                                  pageWidth - marginLeft - marginRight,
                                );
                                challengeLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Recommendations (if available)
                              if (report.recommendations) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Recommendations:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const recLines = pdf.splitTextToSize(
                                  report.recommendations,
                                  pageWidth - marginLeft - marginRight,
                                );
                                recLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Next Goals (if available)
                              if (report.next_goals) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text("Next Goals:", marginLeft, yPosition);
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const nextGoalLines = pdf.splitTextToSize(
                                  report.next_goals,
                                  pageWidth - marginLeft - marginRight,
                                );
                                nextGoalLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Add a separator line between reports
                              if (yPosition > pageHeight - 20) {
                                pdf.addPage();
                                yPosition = 20;
                              }
                              pdf.setDrawColor(200, 200, 200);
                              pdf.line(
                                marginLeft,
                                yPosition,
                                pageWidth - marginRight,
                                yPosition,
                              );
                              yPosition += 8;
                            });

                            pdf.save(
                              `therapy_reports_${student?.name || "student"}_${new Date().toISOString().split("T")[0]}.pdf`,
                            );
                          }}
                          className="flex-1 px-7 py-3 border-2 border-[#E38B52] text-[#E38B52] text-lg rounded-2xl bg-white hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md font-bold"
                          title="Download filtered therapy reports"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Download Reports
                        </button>
                      )}
                    </div>

                    {/* Stats Display with Count-up Animation */}
                    {(() => {
                      // Calculate filtered reports based on current filters
                      const filteredReports = reports.filter((r) => {
                        if (fromDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterFromDate = new Date(fromDate);
                          if (reportDate < filterFromDate) return false;
                        }
                        if (toDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterToDate = new Date(toDate);
                          if (reportDate > filterToDate) return false;
                        }
                        if (selectedTherapyType) {
                          if (
                            !r.therapy_type ||
                            r.therapy_type.trim() !== selectedTherapyType.trim()
                          )
                            return false;
                        }
                        return true;
                      });

                      // Calculate days between dates
                      const daysBetween =
                        fromDate && toDate
                          ? Math.ceil(
                              (new Date(toDate) - new Date(fromDate)) /
                                (1000 * 60 * 60 * 24),
                            ) + 1
                          : 0;

                      const showStats =
                        filteredReports.length > 0 || (fromDate && toDate);

                      // Removed duplicate stats display below filter bar
                      return null;
                    })()}

                    {aiSummaryError && (
                      <div className="p-2 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                        {aiSummaryError}
                      </div>
                    )}
                    {aiSummarizing && (
                      <div className="text-sm text-gray-600 animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                        Generating comprehensive AI analysis...
                      </div>
                    )}
                    {aiAnalysis && !aiSummarizing && (
                      <div className="mt-4 space-y-4 animate-fadeIn">
                        <div className="relative bg-gradient-to-br from-white via-orange-50/40 to-orange-100/60 backdrop-blur-sm p-8 rounded-2xl border border-[#E38B52]/30 shadow-md shadow-orange-100/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-200/40">
                          <h4 className="text-3xl font-extrabold text-[#C56930] mb-6 flex items-center gap-3 pb-3">
                            <svg
                              className="w-7 h-7 text-[#E38B52]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Progress Summary
                            <svg
                              className="w-4 h-4 text-orange-400 cursor-help ml-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              title="AI-generated comprehensive analysis based on therapy reports"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {aiAnalysis && !aiSummarizing && (
                              <>
                                <button
                                  onClick={generateAIAnalysisPDF}
                                  className="ml-auto px-3 py-2 border-2 border-[#E38B52] text-[#E38B52] text-sm rounded-xl bg-white hover:bg-orange-50 active:scale-95 active:bg-orange-100 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold"
                                  title="Download AI Analysis Report as PDF"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Summary
                                </button>
                                <button
                                  onClick={() => handleTranslate()}
                                  disabled={translating}
                                  className="ml-2 px-3 py-2 border-2 border-[#E38B52] text-[#E38B52] text-sm rounded-xl bg-white hover:bg-orange-50 active:scale-95 active:bg-orange-100 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Translate to Malayalam"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="#E38B52"
                                      strokeWidth="2"
                                      fill="#fff"
                                    />
                                    <path
                                      d="M2 12h20"
                                      stroke="#E38B52"
                                      strokeWidth="2"
                                    />
                                    <path
                                      d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                                      stroke="#E38B52"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                  </svg>
                                  {translating ? "Translating..." : "Malayalam"}
                                </button>
                              </>
                            )}
                          </h4>

                          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-auto prose prose-sm max-w-none">
                            {translating ? (
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-4 h-4 border-2 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                                Translating to Malayalam...
                              </div>
                            ) : translatedSummary ? (
                              <div>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-200">
                                  <span className="text-xs font-semibold text-[#E38B52] uppercase">
                                    Translated (Malayalam)
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTranslatedSummary(null);
                                    }}
                                    className="text-xs text-gray-500 hover:text-[#E38B52] underline"
                                  >
                                    Show Original
                                  </button>
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {translatedSummary}
                                </div>
                              </div>
                            ) : (
                              aiAnalysis?.summary ||
                              "No progress summary available"
                            )}
                          </div>
                          {aiAnalysis?.truncated && (
                            <div className="mt-3 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                              ⚠️ Analysis was truncated due to content length.
                              Consider filtering by date range for more detailed
                              analysis.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
              {/* Reports Section at Bottom */}
              <div className="w-full mt-8">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#E38B52]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Therapy Reports
                    </h3>
                  </div>
                  {/* Active Filters Display */}
                  {(fromDate || toDate || selectedTherapyType) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Active Filters:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {fromDate && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Start: {fromDate}
                          </span>
                        )}
                        {toDate && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            End: {toDate}
                          </span>
                        )}
                        {selectedTherapyType && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Type: {selectedTherapyType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {reportsLoading ? (
                    <p className="text-sm text-[#6F6C90]">Loading reports...</p>
                  ) : reports.length === 0 ? (
                    <p className="text-sm text-[#6F6C90]">
                      No therapy reports found for this student.
                    </p>
                  ) : (
                    (() => {
                      const filtered = reports.filter((r) => {
                        if (fromDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterFromDate = new Date(fromDate);
                          if (reportDate < filterFromDate) return false;
                        }
                        if (toDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterToDate = new Date(toDate);
                          if (reportDate > filterToDate) return false;
                        }
                        if (selectedTherapyType) {
                          if (
                            !r.therapy_type ||
                            r.therapy_type.trim() !== selectedTherapyType.trim()
                          )
                            return false;
                        }
                        return true;
                      });
                      const visible = filtered.slice(0, visibleCount);
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-sm text-[#6F6C90]">
                              Showing {Math.min(visibleCount, filtered.length)}{" "}
                              of {filtered.length} reports
                              {filtered.length !== reports.length &&
                                ` (filtered from ${reports.length} total)`}
                            </span>
                            {filtered.length > 0 && (
                              <span className="text-xs text-[#6F6C90]">
                                Date Range:{" "}
                                {filtered.length > 0
                                  ? `${new Date(Math.min(...filtered.map((r) => new Date(r.report_date)))).toLocaleDateString()} - ${new Date(Math.max(...filtered.map((r) => new Date(r.report_date)))).toLocaleDateString()}`
                                  : "No reports"}
                              </span>
                            )}
                          </div>
                          {visible.map((r) => (
                            <details
                              key={r.id}
                              className="bg-white rounded-lg border p-4 shadow-sm"
                            >
                              <summary className="flex justify-between items-center cursor-pointer">
                                <div>
                                  <div className="text-sm text-[#6F6C90]">
                                    {new Date(
                                      r.report_date,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-lg font-semibold text-[#170F49]">
                                    {r.therapy_type || "Therapy"}
                                  </div>
                                </div>
                                <div className="text-sm text-[#6F6C90]">
                                  {r.progress_level || ""}
                                </div>
                              </summary>
                              <div className="mt-4 text-sm text-[#333] space-y-3">
                                {r.progress_notes && (
                                  <div>
                                    <div className="text-xs text-[#6F6C90]">
                                      Progress Notes
                                    </div>
                                    <div className="text-sm">
                                      {r.progress_notes}
                                    </div>
                                  </div>
                                )}
                                {r.goals_achieved && (
                                  <div>
                                    <div className="text-xs text-[#6F6C90] font-semibold mb-2">
                                      Goals Achieved
                                    </div>
                                    <div className="space-y-2">
                                      {typeof r.goals_achieved === "object" ? (
                                        Object.entries(r.goals_achieved).map(
                                          ([key, goal]) => (
                                            <div
                                              key={key}
                                              className="bg-gray-50 p-2 rounded border-l-2 border-[#E38B52]"
                                            >
                                              <div className="flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    goal.checked || false
                                                  }
                                                  disabled
                                                  className="mt-1 w-4 h-4 text-[#E38B52] rounded"
                                                />
                                                <div className="flex-1">
                                                  <div className="font-medium text-sm text-[#170F49]">
                                                    {key
                                                      .split("_")
                                                      .map(
                                                        (word) =>
                                                          word
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          word.slice(1),
                                                      )
                                                      .join(" ")}
                                                  </div>
                                                  {goal.notes && (
                                                    <div className="text-xs text-[#6F6C90] mt-1 italic">
                                                      {goal.notes}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )
                                      ) : (
                                        <div className="text-sm text-[#666]">
                                          {String(r.goals_achieved)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs text-[#6F6C90]">
                                  Recorded
                                </div>
                                <div className="text-sm">
                                  {new Date(r.created_at).toLocaleString()}
                                </div>
                              </div>
                            </details>
                          ))}
                          {filtered.length > visibleCount && (
                            <div className="text-center mt-4">
                              <button
                                onClick={() => setVisibleCount((v) => v + 5)}
                                className="px-4 py-2 bg-[#E38B52] text-white rounded-md"
                              >
                                Load more
                              </button>
                            </div>
                          )}
                          {filtered.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-900 mb-2">
                                No reports found
                              </p>
                              <p className="text-sm text-gray-500">
                                {fromDate || toDate || selectedTherapyType
                                  ? "Try adjusting your filters or clearing them to see all reports."
                                  : "No therapy reports are available for this student."}
                              </p>
                              {(fromDate || toDate || selectedTherapyType) && (
                                <button
                                  onClick={() => {
                                    setFromDate("");
                                    setToDate("");
                                    setSelectedTherapyType("");
                                    setVisibleCount(5);
                                  }}
                                  className="mt-4 px-4 py-2 bg-[#E38B52] text-white rounded-md hover:bg-[#D67A3F] transition-colors duration-200"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "student-details" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Basic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Personal Information
                </h2>
                <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                  {/* Student Photo */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                      <img
                        // This logic shows the preview, then the saved photo, then a placeholder
                        src={
                          photoPreview ||
                          student?.photoUrl ||
                          "https://placehold.co/160x160/EFEFEF/AAAAAA?text=No+Photo"
                        }
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* This is the hidden file input that gets triggered */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/png, image/jpeg"
                      style={{ display: "none" }}
                    />

                    {/* Icon buttons for upload and delete */}
                    <div className="flex items-center gap-2">
                      {/* Upload/Edit button */}
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-2.5 bg-white rounded-lg border border-gray-200 hover:bg-[#E38B52] hover:border-[#E38B52] transition-all duration-200 shadow-sm group"
                        title="Upload Photo"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-600 group-hover:text-white transition-colors duration-200"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </button>

                      {/* Delete button - only show if there's a photo */}
                      {(student?.photoUrl || photoPreview) && (
                        <button
                          onClick={() => {
                            if (photoPreview) {
                              URL.revokeObjectURL(photoPreview);
                              setPhotoPreview(null);
                              setPhotoFile(null);
                              if (fileInputRef.current)
                                fileInputRef.current.value = null;
                            }
                          }}
                          className="p-2.5 bg-white rounded-lg border border-gray-200 hover:bg-red-500 hover:border-red-500 transition-all duration-200 shadow-sm group"
                          title="Delete Photo"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 group-hover:text-white transition-colors duration-200"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* This button only appears when a new file is ready to be saved */}
                    {photoFile && (
                      <button
                        onClick={handlePhotoUpload}
                        disabled={photoUploading}
                        className={`mt-2 px-4 py-2 text-white text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                          photoUploading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {photoUploading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Save Photo
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-8 md:pl-12">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Full Name</p>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            name="name"
                            value={editData?.name || ""}
                            onChange={handleEditChange}
                            className="input-edit"
                          />
                        </>
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Age</p>
                      {editMode ? (
                        <input
                          type="number"
                          name="age"
                          value={editData?.age || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.age}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Student ID</p>
                      {editMode ? (
                        <input
                          type="text"
                          name="studentId"
                          value={student?.studentId || ""}
                          className="input-edit"
                          readOnly
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.studentId || ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Date of Birth</p>
                      {editMode ? (
                        <input
                          type="date"
                          name="dob"
                          value={editData?.dob || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.dob}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Gender</p>
                      {editMode ? (
                        <input
                          type="text"
                          name="gender"
                          value={editData?.gender || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.gender}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Religion</p>
                      {editMode ? (
                        <input
                          type="text"
                          name="religion"
                          value={editData?.religion || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.religion}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Caste</p>
                      {editMode ? (
                        <input
                          type="text"
                          name="caste"
                          value={editData?.caste || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.caste}
                        </p>
                      )}
                    </div>
                    {/* Blood Group - EDIT ONLY */}
                    {editMode && (
                      <div>
                        <p className="text-sm text-[#6F6C90]">Blood Group</p>
                        <input
                          type="text"
                          name="bloodGroup"
                          value={editData?.bloodGroup || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      </div>
                    )}

                    {/* Category - EDIT ONLY */}
                    {editMode && (
                      <div>
                        <p className="text-sm text-[#6F6C90]">Category</p>
                        <input
                          type="text"
                          name="category"
                          value={editData?.category || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            name="aadharNumber"
                            inputMode="numeric"
                            pattern="\d{4}\s?\d{4}\s?\d{4}"
                            maxLength={14}
                            value={editData?.aadharNumber || ""}
                            onChange={handleEditChange}
                            className="input-edit"
                          />
                          {aadharEditError && (
                            <p className="text-red-500 text-xs mt-1">
                              {aadharEditError}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.aadharNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Address Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Birth Place</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="birthPlace"
                        value={editData?.birthPlace || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.birthPlace}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">House Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="houseName"
                        value={editData?.houseName || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.houseName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Block Panchayat</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="blockPanchayat"
                        value={editData?.blockPanchayat || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.blockPanchayat}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Local Body</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="localBody"
                        value={editData?.localBody || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.localBody}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Taluk</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="taluk"
                        value={editData?.taluk || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.taluk}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Street Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="streetName"
                        value={editData?.streetName || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.streetName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Post Office</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="postOffice"
                        value={editData?.postOffice || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.postOffice}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Pin Code</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="pinCode"
                        value={editData?.pinCode || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.pinCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Revenue District</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="revenueDistrict"
                        value={editData?.revenueDistrict || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.revenueDistrict}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Phone Number</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={editData?.phoneNumber || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Email</p>
                    {editMode ? (
                      <input
                        type="email"
                        name="email"
                        value={editData?.email || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Address</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="address"
                        value={editData?.address || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Family Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Family Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Father's Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="fatherName"
                        value={editData?.fatherName || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.fatherName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Mother's Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="motherName"
                        value={editData?.motherName || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.motherName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Disability Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Type of Disability</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="disabilityType"
                        value={editData?.disabilityType || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.disabilityType || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">
                      Percentage of Disability
                    </p>
                    {editMode ? (
                      <input
                        type="number"
                        name="disabilityPercentage"
                        value={editData?.disabilityPercentage || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.disabilityPercentage
                          ? `${student.disabilityPercentage}%`
                          : "N/A"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-span-full">
                  <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                    Identification Marks
                  </h2>
                  <div className="p-6 bg-white/50 rounded-2xl">
                    {editMode ? (
                      <textarea
                        name="identificationMarks"
                        value={editData?.identificationMarks || ""}
                        onChange={handleEditChange}
                        className="input-edit w-full"
                        rows="3"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.identificationMarks || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Academic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Class</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="class"
                        value={editData?.class || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.class}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Division</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="rollNo"
                        value={editData?.rollNo || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.rollNo}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Roll Number</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="rollNo"
                        value={editData?.rollNo || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.rollNo}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Academic Year</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="academicYear"
                        value={editData?.academicYear || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.academicYear}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Admission Number</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="admissionNumber"
                        value={editData?.admissionNumber || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.admissionNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Date of Admission</p>
                    {editMode ? (
                      <input
                        type="date"
                        name="admissionDate"
                        value={editData?.admissionDate || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.admissionDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Class Teacher</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="classTeacher"
                        value={editData?.classTeacher || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.classTeacher || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Bank Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Account Number</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="accountNumber"
                        value={editData?.accountNumber || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.accountNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Bank Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="bankName"
                        value={editData?.bankName || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.bankName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Branch</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="branch"
                        value={editData?.branch || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.branch}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">IFSC Code</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="ifscCode"
                        value={editData?.ifscCode || ""}
                        onChange={handleEditChange}
                        className="input-edit"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {student?.ifscCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Therapies Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Therapies
                </h2>

                {/* Current Therapies */}
                <div className="mb-6 p-6 bg-white/50 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-[#170F49]">
                      Current Therapies
                    </h3>
                    <button className="bg-white/30 backdrop-blur-xl rounded-xl shadow-sm p-2 px-4 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span className="text-sm font-medium">Edit Progress</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Speech Therapy Card */}
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20">
                          {/* Circular Progress */}
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              className="text-gray-200"
                              strokeWidth="5"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                            <circle
                              className="text-[#E38B52]"
                              strokeWidth="5"
                              strokeDasharray={220}
                              strokeDashoffset={66} // 220 - (220 * percentageComplete)
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="text-sm font-medium text-[#170F49]">
                              70%
                            </span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-[#170F49] font-medium mb-1">
                            Speech Therapy
                          </h4>
                          <p className="text-sm text-[#6F6C90] mb-2">
                            Sessions: 15/20
                          </p>
                          <div className="flex items-center gap-2 text-sm text-[#6F6C90]">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Next Session: Tomorrow, 10:00 AM
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Occupational Therapy Card */}
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              className="text-gray-200"
                              strokeWidth="5"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                            <circle
                              className="text-[#E38B52]"
                              strokeWidth="5"
                              strokeDasharray={220}
                              strokeDashoffset={132} // 220 - (220 * percentageComplete)
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="text-sm font-medium text-[#170F49]">
                              40%
                            </span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-[#170F49] font-medium mb-1">
                            Occupational Therapy
                          </h4>
                          <p className="text-sm text-[#6F6C90] mb-2">
                            Sessions: 8/20
                          </p>
                          <div className="flex items-center gap-2 text-sm text-[#6F6C90]">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Next Session: Friday, 2:00 PM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificates Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                  Certificates & Documents
                </h2>
                <div className="p-6 bg-white/50 rounded-2xl">
                  {/* Upload Section */}
                  <div className="mb-6 p-4 bg-white/70 rounded-xl border-2 border-dashed border-[#E38B52]/30">
                    <input
                      type="file"
                      ref={documentInputRef}
                      onChange={handleDocumentChange}
                      accept=".pdf"
                      style={{ display: "none" }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => documentInputRef.current?.click()}
                          className="px-4 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#d67a3f] transition-all duration-200 flex items-center gap-2"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Select PDF Document
                        </button>
                        {documentFile && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#170F49]">
                              {documentFile.name}
                            </span>
                            <span className="text-xs text-[#6F6C90]">
                              ({(documentFile.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                        )}
                      </div>
                      {documentFile && (
                        <button
                          onClick={handleDocumentUpload}
                          disabled={documentUploading}
                          className={`px-4 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            documentUploading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {documentUploading ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Upload
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#6F6C90] mt-2">
                      Only PDF files allowed. Maximum file size: 5MB
                    </p>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-4">
                    {documentsLoading ? (
                      <div className="text-center py-8 text-[#6F6C90]">
                        Loading documents...
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-8 text-[#6F6C90]">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p>No documents uploaded yet</p>
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-white/70 rounded-xl hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                            <div>
                              <p className="font-medium text-[#170F49]">
                                {doc.name}
                              </p>
                              <p className="text-sm text-[#6F6C90]">
                                Uploaded:{" "}
                                {new Date(doc.upload_date).toLocaleDateString()}{" "}
                                • {(doc.file_size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleViewDocument(doc.id, doc.name)
                              }
                              className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                              title="View"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[#6F6C90] group-hover:text-blue-500"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadDocument(doc.id, doc.name)
                              }
                              className="p-2 hover:bg-[#E38B52]/10 rounded-lg transition-all duration-200 group"
                              title="Download"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[#6F6C90] group-hover:text-[#E38B52]"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteDocument(doc.id, doc.name)
                              }
                              className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                              title="Delete"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[#6F6C90] group-hover:text-red-500"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "iep" ? (
            <div className="max-w-6xl mx-auto p-6">
              {/* Header with PDF Download Button */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  {student && (
                    <div className="bg-white/70 rounded-xl px-4 py-3 border border-[#E38B52]/20">
                      <p className="text-sm text-[#170F49]">
                        IEP Report for:{" "}
                        <span className="font-semibold">{student.name}</span>
                        {student.studentId && (
                          <span className="text-xs text-[#6F6C90] ml-2">
                            (ID: {student.studentId})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={downloadIepAsPDF}
                  disabled={!iepData.selectedMonth}
                  className="px-6 py-3 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-lg hover:from-[#C8742F] hover:to-[#E38B52] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Main Content */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8">
                {/* Trimester Report Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-[#170F49] mb-4">
                    TRIMESTER REPORT
                  </h1>
                  <h2 className="text-xl font-semibold text-[#6F6C90] mb-6">
                    Individual Education Program (IEP)
                  </h2>

                  {/* Month Selection */}
                  <div className="flex justify-center">
                    <div className="w-64">
                      <label className="block text-sm font-medium text-[#170F49] mb-2">
                        Select Month
                      </label>
                      <select
                        value={iepData.selectedMonth}
                        onChange={(e) =>
                          handleIepInputChange("selectedMonth", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white shadow-sm"
                      >
                        <option value="">Choose a month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dynamic Table */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={addTableRow}
                      className="px-4 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#C8742F] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-[#E38B52] to-[#F5A572]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/3">
                            ADL SKILLS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/3">
                            ACADEMIC
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/3">
                            BEHAVIOURAL SKILLS
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-white w-16">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {iepData.tableRows.map((row, index) => (
                          <tr
                            key={row.id}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4">
                              <textarea
                                value={row.adlSkills}
                                onChange={(e) =>
                                  handleTableRowChange(
                                    row.id,
                                    "adlSkills",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter ADL skills..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent resize-none"
                                rows={3}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <textarea
                                value={row.academic}
                                onChange={(e) =>
                                  handleTableRowChange(
                                    row.id,
                                    "academic",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter academic skills..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent resize-none"
                                rows={3}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <textarea
                                value={row.behaviouralSkills}
                                onChange={(e) =>
                                  handleTableRowChange(
                                    row.id,
                                    "behaviouralSkills",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter behavioural skills..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent resize-none"
                                rows={3}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              {iepData.tableRows.length > 1 && (
                                <button
                                  onClick={() => removeTableRow(row.id)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                                  title="Remove row"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IEP and Remarks Section */}
                <div className="space-y-6 mb-8">
                  {/* IEP of the Student */}
                  <div>
                    <label className="block text-lg font-semibold text-[#170F49] mb-3">
                      IEP OF THE STUDENT:
                    </label>
                    <textarea
                      value={iepData.iepStudent}
                      onChange={(e) =>
                        handleIepInputChange("iepStudent", e.target.value)
                      }
                      placeholder="Enter the Individual Education Program details for the student..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent resize-none shadow-sm"
                      rows={6}
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-lg font-semibold text-[#170F49] mb-3">
                      Remarks:
                    </label>
                    <textarea
                      value={iepData.remarks}
                      onChange={(e) =>
                        handleIepInputChange("remarks", e.target.value)
                      }
                      placeholder="Enter any additional remarks or observations..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent resize-none shadow-sm"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Signature Fields */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                    Signatures
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#6F6C90] mb-2">
                        Principal
                      </label>
                      <input
                        type="text"
                        value={iepData.signatures.principal}
                        onChange={(e) =>
                          handleSignatureChange("principal", e.target.value)
                        }
                        placeholder="Principal's signature/name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6F6C90] mb-2">
                        Teacher
                      </label>
                      <input
                        type="text"
                        value={iepData.signatures.teacher}
                        onChange={(e) =>
                          handleSignatureChange("teacher", e.target.value)
                        }
                        placeholder="Teacher's signature/name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6F6C90] mb-2">
                        Parent/Guardian
                      </label>
                      <input
                        type="text"
                        value={iepData.signatures.parent}
                        onChange={(e) =>
                          handleSignatureChange("parent", e.target.value)
                        }
                        placeholder="Parent's signature/name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="text-center">
                  <button
                    onClick={saveIepData}
                    disabled={savingIep}
                    className="px-8 py-3 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-lg hover:from-[#C8742F] hover:to-[#E38B52] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                  >
                    {savingIep ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-3m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        <span>Save IEP Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "special-education" ? (
            <div className="max-w-6xl mx-auto p-6">
              {student && (
                <div className="mt-4 mb-2 bg-white/70 rounded-xl px-4 py-3 border border-[#E38B52]/20">
                  <p className="text-sm text-[#170F49]">
                    Special Education report for:{" "}
                    <span className="font-semibold">{student.name}</span>
                    {student.studentId && (
                      <span className="text-xs text-[#6F6C90] ml-2">
                        (ID: {student.studentId})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Upload Section */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* File input (left) */}
                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Report Image
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/bmp,image/tiff"
                        onChange={handleOcrImageSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPG, PNG, BMP, TIFF (Max 10MB)
                      </p>
                    </div>

                    {/* Report date (right) */}
                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Date
                      </label>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={handleOcrUpload}
                      disabled={!ocrImage || ocrLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-lg hover:from-[#C8742F] hover:to-[#E38B52] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {ocrLoading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="text-sm">Processing... (~5s)</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Extract Table
                        </>
                      )}
                    </button>

                    {(ocrImage || extractedTables.length > 0) && (
                      <button
                        onClick={handleClearOcrData}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Clear
                      </button>
                    )}

                    {/* Extraction Success Notification (Temporary) */}
                    {extractionNotification && (
                      <div className="ml-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md animate-fade-in">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="text-sm">
                          <p className="font-medium text-green-800">
                            Successfully extracted{" "}
                            {extractionNotification.tableCount} table(s)
                          </p>
                          <p className="text-xs text-green-700">
                            Method used: {extractionNotification.method}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Display */}
                  {ocrError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Error
                        </p>
                        <p className="text-sm text-red-700">{ocrError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Section */}
              {savedTables.length > 0 && (
                <div className="space-y-6">
                  {/* Extraction Data Display */}
                  {extractionSummary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Extracted Data (Stage 2: A/B Values)
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-700">
                            Skills Found: {extractionSummary.total_skills_found}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {extractionSummary.skills_found?.join(", ")}
                          </p>
                        </div>
                        {extractionSummary.sample_values &&
                          Object.keys(extractionSummary.sample_values).length >
                            0 && (
                            <div className="bg-white rounded p-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Sample Values (First 10 sessions):
                              </p>
                              <div className="space-y-1">
                                {Object.entries(
                                  extractionSummary.sample_values,
                                ).map(([skill, values]) => (
                                  <div
                                    key={skill}
                                    className="text-xs font-mono"
                                  >
                                    <span className="font-semibold text-[#E38B52]">
                                      {skill}:
                                    </span>
                                    <span className="ml-2 text-gray-700">
                                      [{values.join(", ")}]
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Display Tables (all past + current, collapsible) */}
                  {[...savedTables]
                    .sort((a, b) => {
                      const da = new Date(a.report_date || a.extracted_at || 0);
                      const db = new Date(b.report_date || b.extracted_at || 0);
                      return db - da; // newest first
                    })
                    .map((table, tableIndex) => (
                      <details
                        key={tableIndex}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01]"
                      >
                        {/* Clickable header row */}
                        <summary className="bg-gradient-to-r from-[#E38B52] to-[#F5A572] px-6 py-4 flex items-center justify-between cursor-pointer list-none">
                          <div className="flex-1">
                            {/* Primary Info - Always Visible */}
                            <h3 className="text-lg font-bold text-white">
                              Table {tableIndex + 1}
                              {table.rows &&
                                table.rows.length > 0 &&
                                table.rows[0]["Student Name"] && (
                                  <span className="text-sm font-normal ml-2">
                                    – {table.rows[0]["Student Name"]}
                                  </span>
                                )}
                            </h3>
                            <div className="text-sm text-white/90 mt-1.5 font-medium">
                              {table.assessment_phase || "1st Assessment"} •
                              Report Date:{" "}
                              {table.report_date || "Not specified"}
                            </div>

                            {/* Details Toggle */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowTableDetails((prev) => ({
                                  ...prev,
                                  [tableIndex]: !prev[tableIndex],
                                }));
                              }}
                              className="mt-2 text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {showTableDetails[tableIndex]
                                ? "Hide Details"
                                : "Show Details"}
                            </button>

                            {/* Secondary Info - Collapsible */}
                            {showTableDetails[tableIndex] && (
                              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 space-y-1">
                                <div>
                                  Extracted on: {formatDate(table.extracted_at)}
                                </div>
                                <div>
                                  Last edited:{" "}
                                  {formatDate(table.last_edited_at) ||
                                    "Not edited yet"}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <div className="relative">
                              <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                                {table.assessment_phase || "1st assmt"}
                              </span>
                            </div>

                            {/* Export icon */}
                            <button
                              type="button"
                              aria-label="Export table as CSV"
                              title="Export CSV"
                              onClick={(e) => {
                                e.preventDefault();
                                handleExportToCSV(table, tableIndex);
                              }}
                              className="w-11 h-11 rounded-full bg-white/95 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center text-[#E38B52]"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14"
                                />
                              </svg>
                            </button>

                            {/* Delete icon */}
                            <button
                              type="button"
                              aria-label="Delete this table"
                              title="Delete table"
                              onClick={(e) => {
                                e.preventDefault();
                                if (window.confirm("Delete this table?")) {
                                  handleDeleteTable(tableIndex);
                                }
                              }}
                              className="w-11 h-11 rounded-full bg-white/95 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center text-red-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                              >
                                {/* lid */}
                                <path
                                  d="M9 5h6l1 2H8l1-2z"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* body */}
                                <rect
                                  x="8"
                                  y="7"
                                  width="8"
                                  height="11"
                                  rx="1.5"
                                  strokeWidth="1.8"
                                />
                                {/* inner lines */}
                                <line
                                  x1="11"
                                  y1="10"
                                  x2="11"
                                  y2="15"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                                <line
                                  x1="13"
                                  y1="10"
                                  x2="13"
                                  y2="15"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </summary>

                        {(() => {
                          if (!table.rows || !table.rows.length) return null;

                          const headers =
                            table.headers && table.headers.length
                              ? table.headers
                              : Object.keys(table.rows[0] || {});

                          // Column that holds skill names (e.g. "Skill Area")
                          const skillColumn =
                            headers.find((h) =>
                              String(h).toLowerCase().includes("skill"),
                            ) || headers[0];

                          // Session/question columns: everything except skill + metadata
                          const sessionHeaders = headers.filter((h) => {
                            const raw = String(h || "").trim();
                            const lower = raw.toLowerCase();
                            const skillLower = String(skillColumn || "")
                              .trim()
                              .toLowerCase();

                            if (!raw) return false;
                            if (lower === skillLower) return false;
                            if (lower === "student name") return false;
                            if (lower === "register number") return false;
                            if (lower === "assessment date") return false;
                            return true;
                          });

                          if (!sessionHeaders.length) return null;

                          // Only show skills that actually exist in this table
                          const tableKey = tableIndex;
                          const activeKey =
                            activeSkillByTable[tableKey] || null;
                          const isQuestionsOpen =
                            !!questionsOpenByTable[tableKey];

                          const currentSkillMeta = activeKey
                            ? SPECIAL_EDU_SKILLS.find(
                                (s) => s.key === activeKey,
                              )
                            : null;

                          const questions = activeKey
                            ? SPECIAL_EDU_QUESTIONS[activeKey] || []
                            : [];

                          const skillRowIndex = activeKey
                            ? table.rows.findIndex(
                                (row) =>
                                  normalizeSectionKey(row[skillColumn]) ===
                                  activeKey,
                              )
                            : -1;

                          const skillRow =
                            skillRowIndex >= 0
                              ? table.rows[skillRowIndex]
                              : null;
                          const canEdit = !!table.isEditable;

                          const handleToggleCell = (colName, newValue) => {
                            if (!skillRow || !activeKey || !canEdit) return;
                          
                            const phase = table.assessment_phase || '1st assmt';
                            const isQuarterPhase =
                              phase === '1st Qtr' ||
                              phase === '2nd Qtr' ||
                              phase === '3rd Qtr' ||
                              phase === '4th Qtr';
                          
                            setSavedTables(prev => {
                              const nowIso = new Date().toISOString();
                          
                              const updated = prev.map(t => {
                                if (t !== table) return t;
                                const rows = t.rows || [];
                          
                                // For non‑quarter phases (e.g. 1st assmt), edit the base value directly
                                if (!isQuarterPhase) {
                                  const newRows = rows.map((row, idx) =>
                                    idx === skillRowIndex ? { ...row, [colName]: newValue } : row
                                  );
                                  return { ...t, rows: newRows, last_edited_at: nowIso };
                                }
                          
                                // For quarter phases (1st–4th Qtr): only original B can be changed
                                const row = rows[skillRowIndex] || {};
                                const rawCurrent = row[colName];
                                const baseVal =
                                  typeof rawCurrent === 'string'
                                    ? rawCurrent.trim().toUpperCase()
                                    : '';
                          
                                if (baseVal !== 'B') return t; // ignore non‑B cells in quarter phases
                          
                                const cellKey = `${skillRowIndex}:${colName}`;
                                const existingSnapshots = t.quarterSnapshots || {};
                                const phaseSnapshot = existingSnapshots[phase] || {};
                          
                                let newPhaseSnapshot = phaseSnapshot;
                                if (newValue === 'A' || newValue === 'B') {
                                  newPhaseSnapshot = { ...phaseSnapshot, [cellKey]: newValue };
                                } else {
                                  return t;
                                }
                          
                                return {
                                  ...t,
                                  quarterSnapshots: { ...existingSnapshots, [phase]: newPhaseSnapshot },
                                  last_edited_at: nowIso,
                                };
                              });
                          
                              try {
                                if (typeof window !== 'undefined' && id) {
                                  window.localStorage.setItem(
                                    `special-education-tables:${id}`,
                                    JSON.stringify(updated)
                                  );
                                }
                              } catch (err) {
                                console.warn('Failed to persist updated Special Education tables', err);
                              }
                          
                              return updated;
                            });
                          };

                          return (
                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-gray-700">
                                  Questionnaire (A = Yes, B = No)
                                </h4>
                                {activeKey && (
                                  <div className="flex items-center gap-2">
                                    {/* Edit/Save/Saved Toggle */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        if (table.isEditable) {
                                          // Currently in edit mode, save the changes
                                          handleSetTableEditable(table, false);

                                          // Show "Saved ✓" status
                                          setTableSavedStatus((prev) => ({
                                            ...prev,
                                            [tableIndex]: true,
                                          }));

                                          // Revert to "Edit" after 1 second
                                          setTimeout(() => {
                                            setTableSavedStatus((prev) => ({
                                              ...prev,
                                              [tableIndex]: false,
                                            }));
                                          }, 1000);
                                        } else {
                                          // Enter edit mode
                                          handleSetTableEditable(table, true);
                                        }
                                      }}
                                      className={
                                        "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all duration-200 shadow-sm " +
                                        (tableSavedStatus[tableIndex]
                                          ? "bg-green-50 text-green-700 border-green-300"
                                          : table.isEditable
                                            ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                            : "bg-[#E38B52] text-white border-[#E38B52] hover:bg-[#C8742F] hover:shadow-md") +
                                        (pulsatingEditButton[tableKey]
                                          ? " pulsate-edit"
                                          : "")
                                      }
                                    >
                                      {tableSavedStatus[tableIndex] ? (
                                        <span className="flex items-center gap-1">
                                          Saved
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        </span>
                                      ) : table.isEditable ? (
                                        "Save"
                                      ) : (
                                        "Edit"
                                      )}
                                    </button>

                                    {/* Assessment Phase Dropdown - only when editing */}
                                    {table.isEditable && (
                                      <select
                                        value={table.assessment_phase || '1st assmt'}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          e.stopPropagation();
                                          const phase = e.target.value;
                                          const nowIso = new Date().toISOString();

                                          setSavedTables(prev => {
                                            const updated = prev.map(t =>
                                              t === table
                                                ? { ...t, assessment_phase: phase, last_edited_at: nowIso }
                                                : t
                                            );
                                            try {
                                              if (typeof window !== 'undefined' && id) {
                                                const key = `special-education-tables:${id}`;
                                                window.localStorage.setItem(key, JSON.stringify(updated));
                                              }
                                            } catch (err) {
                                              console.warn('Failed to persist assessment phase', err);
                                            }
                                            return updated;
                                          });
                                        }}
                                        className="text-[10px] bg-white text-[#170F49] border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E38B52] shadow-sm"
                                      >
                                        {SPECIAL_EDU_ASSESSMENT_PHASES.map(phase => (
                                          <option key={phase} value={phase}>{phase}</option>
                                        ))}
                                      </select>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setQuestionsOpenByTable((prev) => ({
                                          ...prev,
                                          [tableKey]: !prev[tableKey],
                                        }))
                                      }
                                      className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                                    >
                                      {questionsOpenByTable[tableKey]
                                        ? "Hide questions"
                                        : "Show questions"}
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!canEdit && (
                                <p className="text-[11px] text-gray-500 mb-1">
                                  This table is read-only. Click "Edit" in the
                                  header to modify.
                                </p>
                              )}

                              {/* Questions for the currently selected skill only */}
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                {!activeKey ? (
                                  <div className="text-[11px] text-gray-500">
                                    Click a skill in the Skill Area column to
                                    view its questions.
                                  </div>
                                ) : !skillRow ? (
                                  <div className="text-[11px] text-gray-500">
                                    No data for this skill in this table.
                                  </div>
                                ) : !isQuestionsOpen ? (
                                  <div className="text-[11px] text-gray-500">
                                    Questions are hidden. Click "Show questions"
                                    to view them.
                                  </div>
                                ) : (
                                  <div
                                    className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden pr-1"
                                    id={`questions-container-${tableKey}`}
                                  >
                                    {questions
                                      .slice(0, sessionHeaders.length)
                                      .map((questionText, idx) => {
                                        const colName = sessionHeaders[idx];
                                        const phase =
                                          table.assessment_phase || "1st assmt";
                                        const quarterOverrides =
                                          table.quarterOverrides || {};
                                        const cellKey = `${skillRowIndex}:${colName}`;

                                        const rawValue = skillRow[colName];
                                        const baseVal =
                                          typeof rawValue === 'string'
                                            ? rawValue.trim().toUpperCase()
                                            : '';
                                        
                                        const snapshots = table.quarterSnapshots || {};
                                        const effectiveVal = getEffectiveValueForPhase(
                                          baseVal,
                                          cellKey,
                                          phase,
                                          snapshots
                                        );
                                        
                                        const isYes = effectiveVal === 'A';
                                        const isNo = effectiveVal === 'B';
                                        const isActiveQuestion =
                                          activeQuestionByTable[tableKey] ===
                                          idx;

                                        return (
                                          <div
                                            key={idx}
                                            ref={(el) => {
                                              if (
                                                !questionRefs.current[tableKey]
                                              ) {
                                                questionRefs.current[tableKey] =
                                                  {};
                                              }
                                              questionRefs.current[tableKey][
                                                idx
                                              ] = el;
                                            }}
                                            className={
                                              "flex flex-wrap items-center gap-2 text-[11px] rounded-lg px-2 py-1.5 border transition-all duration-200 " +
                                              (isActiveQuestion
                                                ? "bg-[#E38B52]/20 border-[#E38B52] shadow-md scale-105"
                                                : "bg-gray-50 border-gray-100")
                                            }
                                          >
                                            <span className="flex-1 min-w-0 break-words">
                                              <span className="font-semibold mr-1">
                                                {idx + 1}.
                                              </span>
                                              {questionText}
                                            </span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              <span
                                                role="button"
                                                onClick={() => {
                                                  if (canEdit) {
                                                    handleToggleCell(
                                                      colName,
                                                      "A",
                                                    );
                                                  } else {
                                                    // Trigger pulsate animation on edit button
                                                    setPulsatingEditButton(
                                                      (prev) => ({
                                                        ...prev,
                                                        [tableKey]: true,
                                                      }),
                                                    );
                                                    setTimeout(() => {
                                                      setPulsatingEditButton(
                                                        (prev) => ({
                                                          ...prev,
                                                          [tableKey]: false,
                                                        }),
                                                      );
                                                    }, 3000);
                                                  }
                                                }}
                                                className={
                                                  "px-2 py-[1px] rounded-full border text-[10px] " +
                                                  (canEdit
                                                    ? "cursor-pointer "
                                                    : "cursor-not-allowed opacity-60 ") +
                                                  (isYes
                                                    ? "bg-green-100 text-green-700 border-green-300"
                                                    : "text-gray-500 border-gray-200 hover:bg-green-50")
                                                }
                                              >
                                                Yes
                                              </span>

                                              <span
                                                role="button"
                                                onClick={() => {
                                                  if (canEdit) {
                                                    handleToggleCell(
                                                      colName,
                                                      "B",
                                                    );
                                                  } else {
                                                    // Trigger pulsate animation on edit button
                                                    setPulsatingEditButton(
                                                      (prev) => ({
                                                        ...prev,
                                                        [tableKey]: true,
                                                      }),
                                                    );
                                                    setTimeout(() => {
                                                      setPulsatingEditButton(
                                                        (prev) => ({
                                                          ...prev,
                                                          [tableKey]: false,
                                                        }),
                                                      );
                                                    }, 3000);
                                                  }
                                                }}
                                                className={
                                                  "px-2 py-[1px] rounded-full border text-[10px] " +
                                                  (canEdit
                                                    ? "cursor-pointer "
                                                    : "cursor-not-allowed opacity-60 ") +
                                                  (isNo
                                                    ? "bg-red-100 text-red-700 border-red-300"
                                                    : "text-gray-500 border-gray-200 hover:bg-red-50")
                                                }
                                              >
                                                No
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Original table view with grouped totals/quarters */}
                        <div className="overflow-x-auto">
                          {(() => {
                            const rawHeaders =
                              table.headers && table.headers.length
                                ? table.headers
                                : table.rows && table.rows.length
                                  ? Object.keys(table.rows[0] || {})
                                  : [];
                            // Drop non-data columns
                            const allHeaders = rawHeaders.filter(
                              (h) =>
                                h !== "Student Name" &&
                                h !== "Register Number" &&
                                h !== "Assessment Date",
                            );

                            const normalize = (h) =>
                              String(h || "")
                                .toLowerCase()
                                .replace(/\s+/g, "")
                                .replace(/[^a-z0-9]/g, "");

                            // Detect summary columns by name
                            const totalAKey = allHeaders.find(
                              (h) => normalize(h) === "totala",
                            );
                            const totalBKey = allHeaders.find(
                              (h) => normalize(h) === "totalb",
                            );

                            const quarterDefs = [
                              { pattern: "iqr", label: "I Qr" },
                              { pattern: "iiqr", label: "II Qr" },
                              { pattern: "iiiqr", label: "III Qr" },
                              { pattern: "ivqr", label: "IV Qr" },
                            ];
                            const quarterKeys = quarterDefs.map((def) => ({
                              def,
                              key:
                                allHeaders.find(
                                  (h) => normalize(h) === def.pattern,
                                ) || null,
                            }));

                            // Base (skill + 1..20 etc.), excluding summary cols
                            const summarySet = new Set(
                              [
                                totalAKey,
                                totalBKey,
                                ...quarterKeys.map((q) => q.key),
                              ].filter(Boolean),
                            );
                            const baseHeaders = allHeaders.filter(
                              (h) => !summarySet.has(h),
                            );

                            // Identify the skill column in this table
                            const skillColumn =
                              allHeaders.find((h) =>
                                String(h || "")
                                  .toLowerCase()
                                  .includes("skill"),
                              ) || allHeaders[0];

                          const sessionHeaders = baseHeaders.filter(h => h !== skillColumn);
                      
                          // Table key and currently active skill for this table
                          const tableKey = tableIndex;
                          const activeKey = activeSkillByTable[tableKey] || null;
                      
                          // Build leaf columns (second header row + body)
                          const leafColumns = [];
                          
                          
                        
                          
                          
                      
                          // Base columns: one cell, spanning both header rows
                          baseHeaders.forEach(h => {
                            const isSkillCol = h === skillColumn;
                            leafColumns.push({
                              group: null,
                              header: String(h).replace(/^Session\s+/i, ''),
                              subLabel: null,
                              isSkill: isSkillCol,
                              fieldName: h,
                              getValue: row => row[h],
                            });
                          });
                      
                          // 1st Assessment group: TOTAL A / TOTAL B
                          if (totalAKey || totalBKey) {
                            if (totalAKey) {
                              leafColumns.push({
                                group: '1st Assmt',
                                header: 'A',
                                subLabel: 'A',
                                getValue: row => row[totalAKey],
                              });
                            }
                            if (totalBKey) {
                              leafColumns.push({
                                group: '1st Assmt',
                                header: 'B',
                                subLabel: 'B',
                                getValue: row => row[totalBKey],
                              });
                            }
                          }
                      
                          // Quarter groups: for now, show existing value under A, leave B empty
                          quarterKeys.forEach(({ def, key }) => {
                            if (!key) return;
                            leafColumns.push({
                              group: def.label,
                              header: 'A',
                              subLabel: 'A',
                              getValue: row => row[key],
                            });
                            leafColumns.push({
                              group: def.label,
                              header: 'B',
                              subLabel: 'B',
                              getValue: () => '',
                            });
                          });
                      
                          if (!leafColumns.length) return null;
                      
                          return (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                {/* Top header row: base cols (rowSpan=2) + grouped headings */}
                                <tr>
                                  {(() => {
                                    const cells = [];
                                    let i = 0;
                                    while (i < leafColumns.length) {
                                      const col = leafColumns[i];
                                      if (!col.group) {
                                        // Simple column spanning both header rows
                                        cells.push(
                                          <th
                                            key={`h1-${i}`}
                                            rowSpan={2}
                                            className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            {col.header}
                                          </th>
                                        );
                                        i += 1;
                                        continue;
                                      }
                                      // Grouped columns (1st Assessment, I Qr, …)
                                      const group = col.group;
                                      let span = 0;
                                      while (
                                        i + span < leafColumns.length &&
                                        leafColumns[i + span].group === group
                                      ) {
                                        span += 1;
                                      }
                                      cells.push(
                                        <th
                                          key={`group-${group}-${i}`}
                                          colSpan={span}
                                          className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider"
                                        >
                                          {group}
                                        </th>
                                      );
                                      i += span;
                                    }
                                    return cells;
                                  })()}
                                </tr>
                                {/* Second header row: A/B under each grouped heading */}
                                <tr>
                                  {leafColumns.map((col, idx) =>
                                    col.group ? (
                                      <th
                                        key={`h2-${idx}`}
                                        className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {col.subLabel || col.header}
                                      </th>
                                    ) : null
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {table.rows?.map((row, rowIdx) => {
                                  const rawSkillVal = row[skillColumn];
                                  const normalizedSkill = normalizeSectionKey(rawSkillVal);
                                  const rowSkillKey = normalizedSkill || null;
                                  const isRowSelected = rowSkillKey && activeKey === rowSkillKey;
                                  const phase = table.assessment_phase || '1st assmt';
                                  const snapshots = table.quarterSnapshots || {};
                              
                                  
                                  // Function to calculate A/B counts for any specific phase
                                  const getCountsForPhase = (targetPhase) => {
                                    let a = 0;
                                    let b = 0;
                                    sessionHeaders.forEach(colName => {
                                      const raw = row[colName];
                                      const baseVal =
                                        typeof raw === 'string' ? raw.trim().toUpperCase() : '';
                                      const cellKey = `${rowIdx}:${colName}`;
                                  
                                      const v = getEffectiveValueForPhase(
                                        baseVal,
                                        cellKey,
                                        targetPhase,
                                        snapshots
                                      );
                                      if (v === 'A') a += 1;
                                      else if (v === 'B') b += 1;
                                    });
                                    return { aCount: a, bCount: b };
                                  };
                              
                                  return (
                                    <tr
                                      key={rowIdx}
                                      className={
                                        'hover:bg-gray-50 ' +
                                        (isRowSelected ? 'bg-[#FFEBD7]' : '')
                                      }
                                    >
                                      {leafColumns.map((col, cellIdx) => {
                                        // Determine if this cell is one of the summary A/B cells
                                        const isSummaryCell = !!col.group;
                                        let cellValue;
                              
                                        if (isSummaryCell) {
                                          const label = (col.subLabel || col.header || '').toUpperCase();
                                          
                                          // Determine which phase this column represents
                                          let columnPhase = '1st assmt';
                                          if (col.group === 'I Qr') columnPhase = '1st Qtr';
                                          else if (col.group === 'II Qr') columnPhase = '2nd Qtr';
                                          else if (col.group === 'III Qr') columnPhase = '3rd Qtr';
                                          else if (col.group === 'IV Qr') columnPhase = '4th Qtr';
                                          
                                          let showCounts = true;
                                          if (columnPhase !== '1st assmt') {
                                            const phaseSnapshot = snapshots[columnPhase];
                                            if (!phaseSnapshot || Object.keys(phaseSnapshot).length === 0) {
                                              showCounts = false;
                                            }
                                          }

                                          if (showCounts) {
                                            const { aCount: colACount, bCount: colBCount } =
                                              getCountsForPhase(columnPhase);

                                            if (label === 'A') {
                                              cellValue = colACount || '0';
                                            } else if (label === 'B') {
                                              cellValue = colBCount || '0';
                                            } else {
                                              cellValue = '-';
                                            }
                                          } else {
                                            // quadrant not edited yet → show "-"
                                            cellValue = '-';
                                          }
                                        } else {
                                          const raw = col.getValue(row);
                                          cellValue =
                                            raw === undefined || raw === null || raw === '' ? '-' : raw;
                                        }
                              
                                        const fieldName = col.fieldName;
                                        const isSessionBaseCell =
                                          !col.group && !col.isSkill && fieldName && sessionHeaders.includes(fieldName);
                                        
                                        let hasQuadrantChange = false;
                                        let overrideQuarter = null;
                                        if (isSessionBaseCell) {
                                          const raw = row[fieldName];
                                          const baseVal =
                                            typeof raw === 'string' ? raw.trim().toUpperCase() : '';
                                          const cellKey = `${rowIdx}:${fieldName}`;
                                          const effectiveVal = getEffectiveValueForPhase(
                                            baseVal,
                                            cellKey,
                                            phase,
                                            snapshots
                                          );
                                          hasQuadrantChange = baseVal === 'B' && effectiveVal === 'A';
                                          
                                          // Find which quarter made the change (for correct strike pattern)
                                          if (hasQuadrantChange) {
                                            const phaseOrder = ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'];
                                            const idx = phaseOrder.indexOf(phase);
                                            if (idx >= 0) {
                                              for (let i = 0; i <= idx; i++) {
                                                const p = phaseOrder[i];
                                                const map = snapshots[p];
                                                if (map && map[cellKey] === 'A') {
                                                  overrideQuarter = p;
                                                  break;
                                                }
                                              }
                                            }
                                          }
                                        }
                                        
                                        // For color: just use the actual letter we see (A = blue, B = red)
                                        const isAVisual = !isSummaryCell && cellValue === 'A';
                                        const isBVisual = !isSummaryCell && cellValue === 'B';
                                        
                                        let textClass;
                                        if (isSummaryCell) textClass = 'text-gray-900 ';
                                        else if (isAVisual) textClass = 'text-blue-600 ';
                                        else if (isBVisual) textClass = 'text-red-600 '; // B stays red even when overridden
                                        else textClass = 'text-gray-900 ';

                                          let cellInner = cellValue;
                                          // Show B with strikethrough pattern based on WHICH quarter the override was made in
                                          if (
                                            isSessionBaseCell &&
                                            cellValue === "B" &&
                                            hasQuadrantChange &&
                                            !isSummaryCell
                                          ) {
                                            if (overrideQuarter === "1st Qtr") {
                                              // 1st Qtr override: horizontal lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[30%]" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-1/2 -translate-y-1/2" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "2nd Qtr"
                                            ) {
                                              // 2nd Qtr override: vertical lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[30%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-1/2 -translate-x-1/2" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "3rd Qtr"
                                            ) {
                                              // 3rd Qtr override: grid (horizontal + vertical)
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[30%]" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-1/2 -translate-y-1/2" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[70%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[30%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-1/2 -translate-x-1/2" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "4th Qtr"
                                            ) {
                                              // 4th Qtr override: diagonal lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute inset-0">
                                                    <span
                                                      className="absolute w-[141%] h-[1px] bg-blue-600 left-1/2 top-[30%] -translate-x-1/2"
                                                      style={{
                                                        transform:
                                                          "translateX(-50%) rotate(45deg)",
                                                        transformOrigin:
                                                          "center",
                                                      }}
                                                    />
                                                    <span
                                                      className="absolute w-[141%] h-[1px] bg-blue-600 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                                      style={{
                                                        transform:
                                                          "translate(-50%, -50%) rotate(45deg)",
                                                        transformOrigin:
                                                          "center",
                                                      }}
                                                    />
                                                    <span
                                                      className="absolute w-[141%] h-[1px] bg-blue-600 left-1/2 top-[70%] -translate-x-1/2"
                                                      style={{
                                                        transform:
                                                          "translateX(-50%) rotate(45deg)",
                                                        transformOrigin:
                                                          "center",
                                                      }}
                                                    />
                                                  </span>
                                                </span>
                                              );
                                            }
                                          }

                                          let onClick;
                                          let extraClass = "";

                                          // Clicking the skill column selects the skill and opens questions
                                          if (col.isSkill && rowSkillKey) {
                                            onClick = () => {
                                              setActiveSkillByTable((prev) => {
                                                const isSame =
                                                  prev[tableKey] ===
                                                  rowSkillKey;
                                                const nextKey = isSame
                                                  ? undefined
                                                  : rowSkillKey;

                                                setQuestionsOpenByTable(
                                                  (prevOpen) => ({
                                                    ...prevOpen,
                                                    [tableKey]: !!nextKey,
                                                  }),
                                                );

                                                // Clear active question when toggling skill
                                                if (!nextKey) {
                                                  setActiveQuestionByTable(
                                                    (prevQ) => ({
                                                      ...prevQ,
                                                      [tableKey]: undefined,
                                                    }),
                                                  );
                                                }

                                                return {
                                                  ...prev,
                                                  [tableKey]: nextKey,
                                                };
                                              });
                                            };
                                            extraClass =
                                              " cursor-pointer " +
                                              (isRowSelected
                                                ? "font-semibold text-gray-900 border-l-4 border-[#E38B52]"
                                                : "hover:bg-orange-50");
                                          }

                                          // Clicking a session cell (1, 2, 3, etc.) navigates to that question
                                          if (
                                            isSessionBaseCell &&
                                            rowSkillKey
                                          ) {
                                            const questionIdx =
                                              sessionHeaders.indexOf(fieldName);
                                            onClick = () => {
                                              // First, ensure the skill is selected and questions are open
                                              setActiveSkillByTable((prev) => ({
                                                ...prev,
                                                [tableKey]: rowSkillKey,
                                              }));

                                              setQuestionsOpenByTable(
                                                (prev) => ({
                                                  ...prev,
                                                  [tableKey]: true,
                                                }),
                                              );

                                              // Set the active question
                                              setActiveQuestionByTable(
                                                (prev) => ({
                                                  ...prev,
                                                  [tableKey]: questionIdx,
                                                }),
                                              );

                                              // Scroll to the question after a brief delay to ensure rendering
                                              setTimeout(() => {
                                                const questionEl =
                                                  questionRefs.current[
                                                    tableKey
                                                  ]?.[questionIdx];
                                                if (questionEl) {
                                                  questionEl.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center",
                                                  });
                                                }
                                              }, 200);
                                            };

                                            extraClass =
                                              " cursor-pointer hover:bg-[#E38B52]/10 hover:scale-110 transition-all duration-150";
                                          }

                                          return (
                                            <td
                                              key={cellIdx}
                                              onClick={onClick}
                                              className={
                                                `relative px-2 py-1 whitespace-nowrap text-xs font-semibold ` +
                                                (col.group
                                                  ? "text-center "
                                                  : "text-left ") +
                                                textClass +
                                                extraClass
                                              }
                                            >
                                              {cellInner}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </details>
                    ))}
                </div>
              )}

              {/* Instructions */}
              {savedTables.length === 0 && !ocrLoading && (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-[#E38B52]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-[#E38B52]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tables extracted yet
                  </h3>
                  <p className="text-gray-600">
                    Upload an image of a student report table to get started
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-6 items-start justify-center relative max-w-[1600px] mx-auto">
              {/* Left Sidebar Navigation */}
              <aside className="w-64 flex-shrink-0 sticky top-5 self-start">
                <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 w-64 z-30 max-h-[calc(100vh-40px)] overflow-y-auto">
                  <div className="mb-6 pb-3 border-b border-[#E38B52]/20">
                    <h3 className="text-lg font-bold text-[#170F49] mb-3">
                      Case Record Sections
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <button
                          onClick={handleEditStart}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-[#E38B52] rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform border border-[#E38B52]/20"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-[#E38B52] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 border border-[#E38B52]/20">
                          Edit
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group flex-1">
                        <button
                          onClick={handleDownloadCaseRecord}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-xl hover:from-[#C8742F] hover:to-[#E38B52] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-[#E38B52] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 border border-[#E38B52]/20">
                          Download
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    {[
                      {
                        id: "identification",
                        label: "Identification Data",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "demographic",
                        label: "Demographic Data",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "contact",
                        label: "Contact & Medical",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "family",
                        label: "Family History",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "development",
                        label: "Development History",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "education",
                        label: "Special Education",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "medical",
                        label: "Medical Information",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "documents",
                        label: "Documents",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ),
                      },
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveCaseSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          activeCaseSection === section.id
                            ? "bg-[#E38B52] text-white shadow-lg"
                            : "bg-white/50 text-[#170F49] hover:bg-white/80"
                        }`}
                      >
                        <span
                          className={`transition-all duration-300 ${
                            activeCaseSection === section.id
                              ? "text-white"
                              : "text-[#E38B52]"
                          }`}
                        >
                          {section.icon}
                        </span>
                        <span className="text-sm font-medium">
                          {section.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Right Content Area */}
              <div className="flex-1 max-w-[1100px]">
                {/* Case Record Completion Progress Bar - always visible */}
                <div className="mb-8 bg-white/50 rounded-2xl p-6 shadow-lg border border-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[#170F49]">
                      Case Record Completion
                    </h3>
                    <span className="text-xl font-bold text-[#E38B52]">
                      {caseRecordCompletion}%
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-3 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#F58540] to-[#E38B52] h-3 rounded-full shadow-md transition-all duration-700 ease-out"
                      style={{ width: `${caseRecordCompletion}%` }}
                    ></div>
                  </div>
                </div>

                {/* Identification Data Section */}
                {activeCaseSection === "identification" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                      Identification Data
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Name</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="name"
                              value={editData?.name || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.name || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Admission No</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="admissionNumber"
                              value={editData?.admissionNumber || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.admissionNumber || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">
                            Date of Birth
                          </p>
                          {editMode ? (
                            <input
                              type="date"
                              name="dob"
                              value={editData?.dob || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.dob || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Age</p>
                          {editMode ? (
                            <input
                              type="number"
                              name="age"
                              value={editData?.age || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.age || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Sex</p>
                          {editMode ? (
                            <select
                              name="gender"
                              value={editData?.gender || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.gender || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Education</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="class"
                              value={editData?.class || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.class || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Blood Group</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="bloodGroup"
                              value={editData?.bloodGroup || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.bloodGroup || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Religion</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="religion"
                              value={editData?.religion || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.religion || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">
                            Category (SC/ST/OBC/OEC)
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="category"
                              value={editData?.category || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.category || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-4">
                          <p className="text-sm text-[#6F6C90]">
                            Aadhar Number
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="aadharNumber"
                              value={editData?.aadharNumber || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.aadharNumber || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Demographic Data Section */}
                {activeCaseSection === "demographic" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Demographic Data
                    </h2>
                    <div className="space-y-6">
                      {/* Family Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Father's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Father's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherName"
                                  value={editData?.fatherName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Education
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherEducation"
                                  value={editData?.fatherEducation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherEducation || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherOccupation"
                                  value={editData?.fatherOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mother's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Mother's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherName"
                                  value={editData?.motherName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Education
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherEducation"
                                  value={editData?.motherEducation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherEducation || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherOccupation"
                                  value={editData?.motherOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Guardian's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Guardian's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianName"
                                  value={editData?.guardianName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Relationship
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianRelationship"
                                  value={editData?.guardianRelationship || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianRelationship || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianOccupation"
                                  value={editData?.guardianOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info Section */}
                      <div className="bg-white/50 rounded-2xl p-6 mt-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Total Family Income per Month
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="totalFamilyIncome"
                                value={editData?.totalFamilyIncome || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.totalFamilyIncome || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Address & Phone Number
                            </p>
                            <p className="text-[#170F49] font-medium">
                              {student?.address_and_phone ||
                                `${student?.address}, ${student?.phoneNumber}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact & Medical Information */}
                {activeCaseSection === "contact" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Contact & Medical Information
                    </h2>
                    <div className="p-8 bg-white/50 rounded-2xl mb-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/60">
                        <div>
                          <p className="text-sm text-[#6F6C90]">
                            Informant's Name
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="informantName"
                              value={editData?.informantName || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-lg text-[#170F49] font-medium">
                              {student?.informantName || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Relationship</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="informantRelationship"
                              value={editData?.informantRelationship || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-lg text-[#170F49] font-medium">
                              {student?.informantRelationship || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="pb-6 border-b border-white/60">
                        <p className="text-sm text-[#6F6C90]">
                          Duration of Contact
                        </p>
                        {editMode ? (
                          <input
                            type="text"
                            name="durationOfContact"
                            value={editData?.durationOfContact || ""}
                            onChange={handleEditChange}
                            className="input-edit"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium">
                            {student?.durationOfContact || "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="pb-6 border-b border-white/60">
                        <p className="text-sm text-[#6F6C90]">
                          Present Complaints
                        </p>
                        {editMode ? (
                          <textarea
                            name="presentComplaints"
                            value={editData?.presentComplaints || ""}
                            onChange={handleEditChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] bg-white/80 resize-vertical"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium leading-relaxed">
                            {student?.presentComplaints || "N/A"}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">
                          Previous Consultation and Treatments
                        </p>
                        {editMode ? (
                          <textarea
                            name="previousTreatments"
                            value={editData?.previousTreatments || ""}
                            onChange={handleEditChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] bg-white/80 resize-vertical"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium leading-relaxed">
                            {student?.previousTreatments || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Family History */}
                {activeCaseSection === "family" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Family History
                    </h2>
                    <div className="space-y-6">
                      {/* Household Composition */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Household Composition
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse rounded-xl overflow-hidden">
                            <thead className="bg-[#E38B52]/10">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  S.No
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Age
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Education
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Occupation
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Health
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Income
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/70">
                              {student?.household &&
                              student.household.length > 0 ? (
                                student.household.map((member, index) => (
                                  <tr
                                    key={index}
                                    className="border-b border-[#E38B52]/10 last:border-b-0"
                                  >
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.name || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.age || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.education || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.occupation || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.health || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {member.income || "N/A"}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="7"
                                    className="px-4 py-8 text-sm text-[#6F6C90] text-center"
                                  >
                                    No household composition data available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Medical History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Medical History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Mental Illness
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.mental_illness"
                                value={
                                  editData?.familyHistory?.mental_illness || ""
                                }
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.mental_illness ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Mental Retardation
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.mental_retardation"
                                value={
                                  editData?.familyHistory?.mental_retardation ||
                                  ""
                                }
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.mental_retardation ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Epilepsy and Others
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.epilepsy"
                                value={editData?.familyHistory?.epilepsy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.epilepsy || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Birth History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Birth History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Prenatal History
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.prenatal"
                                value={editData?.birthHistory?.prenatal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.prenatal || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Natal and Neonatal
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.natal"
                                value={editData?.birthHistory?.natal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.natal || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Postnatal History
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.postnatal"
                                value={editData?.birthHistory?.postnatal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.postnatal || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Developmental History */}
                {activeCaseSection === "development" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      Development History
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl mt-6">
                      <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                        Developmental History
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-white/70 rounded-xl">
                        {/* Check if developmentHistory exists and has entries */}
                        {student?.developmentHistory &&
                        Object.keys(student.developmentHistory).length > 0 ? (
                          Object.entries(student.developmentHistory).map(
                            ([key, value]) => (
                              <div key={key} className="flex items-center">
                                {/* Display a green check for true, red cross for false */}
                                {value ? (
                                  <span className="text-green-500 font-bold mr-2 text-xl">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-bold mr-2 text-xl">
                                    ✗
                                  </span>
                                )}
                                {/* Format the key from snake_case to Title Case */}
                                <p className="text-[#170F49] font-medium capitalize">
                                  {key.replace(/_/g, " ")}
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <p className="col-span-full text-center text-[#6F6C90]">
                            No development history recorded.
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Additional Information Section */}
                    <div className="mt-6">
                      <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-[#E38B52]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Additional Information
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Check if additionalInfo exists and has keys */}
                        {student?.additionalInfo &&
                        Object.keys(student.additionalInfo).length > 0 ? (
                          Object.entries(student.additionalInfo).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="bg-white/50 rounded-2xl p-6 shadow-sm min-h-[120px]"
                              >
                                <h3 className="text-md font-semibold text-[#170F49] mb-2 capitalize">
                                  {key.replace(/_/g, " ")}
                                </h3>
                                <p className="text-[#170F49] text-base leading-relaxed">
                                  {value || "N/A"}
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="md:col-span-2 text-center p-6 bg-white/50 rounded-2xl">
                            <p className="text-[#6F6C90]">
                              No additional information has been recorded.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Education Assessment Section */}
                {activeCaseSection === "education" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h2"
                        />
                      </svg>
                      Special Education Assessment
                    </h2>

                    {/* Horizontal Navigation for Subsections */}
                    <div className="mb-8 overflow-x-auto">
                      <div className="flex gap-2 min-w-max pb-2">
                        {[
                          { id: "self-help", label: "Self Help" },
                          { id: "motor", label: "Motor" },
                          { id: "sensory", label: "Sensory" },
                          { id: "socialization", label: "Socialization" },
                          { id: "cognitive", label: "Cognitive" },
                          { id: "academic", label: "Academic" },
                          { id: "prevocational", label: "Prevocational" },
                          { id: "other-info", label: "Other Info" },
                        ].map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() =>
                              setActiveEducationSubsection(subsection.id)
                            }
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                              activeEducationSubsection === subsection.id
                                ? "bg-[#E38B52] text-white shadow-lg"
                                : "bg-white/50 text-[#170F49] hover:bg-white/80"
                            }`}
                          >
                            {subsection.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Self Help */}
                    {activeEducationSubsection === "self-help" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Self Help
                        </h3>

                        {/* Food Habits */}
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Food Habits
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Eating
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.food_habits.eating"
                                  value={
                                    editData?.assessment?.self_help?.food_habits
                                      ?.eating || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe eating habits and capabilities"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.food_habits
                                    ?.eating || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Drinking
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.food_habits.drinking"
                                  value={
                                    editData?.assessment?.self_help?.food_habits
                                      ?.drinking || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe drinking habits and capabilities"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.food_habits
                                    ?.drinking || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Toilet Habits (Include mention hygenic where
                              applicable)
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.toilet_habits"
                                value={
                                  editData?.assessment?.self_help
                                    ?.toilet_habits || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe toilet habits and hygiene practices"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help
                                  ?.toilet_habits || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Brushing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.brushing"
                                value={
                                  editData?.assessment?.self_help?.brushing ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe brushing capabilities and routine"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help?.brushing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Bathing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.bathing"
                                value={
                                  editData?.assessment?.self_help?.bathing || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe bathing capabilities and habits"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help?.bathing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dressing */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Dressing
                          </h4>
                          <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Removing and wearing clothes
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.removing_and_wearing"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.removing_and_wearing || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to remove and wear clothes independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.removing_and_wearing || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Unbuttoning and Buttoning
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.buttoning"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.buttoning || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to handle buttons independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.buttoning || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                wearing shoes/Slippers
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.footwear"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.footwear || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to wear footwear independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.footwear || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Grooming (include shaving skills where
                                applicable)
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.grooming"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.grooming || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe grooming abilities including shaving if applicable"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.grooming || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Motor */}
                    {activeEducationSubsection === "motor" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Motor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Gross Motor
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.motor.gross_motor"
                                value={
                                  editData?.assessment?.motor?.gross_motor || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe capabilities in large movements, balance, and coordination"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.motor?.gross_motor ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Fine Motor
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.motor.fine_motor"
                                value={
                                  editData?.assessment?.motor?.fine_motor || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe capabilities in small, precise movements"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.motor?.fine_motor ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sensory */}
                    {activeEducationSubsection === "sensory" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Sensory
                        </h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          {editMode ? (
                            <input
                              type="text"
                              name="assessment.sensory"
                              value={editData?.assessment?.sensory || ""}
                              onChange={handleEditChange}
                              placeholder="Describe sensory responses and processing capabilities"
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.sensory || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Socialization */}
                    {activeEducationSubsection === "socialization" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Socialization
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Language/Communication
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.language_communication"
                                value={
                                  editData?.assessment?.socialization
                                    ?.language_communication || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe communication abilities and language skills"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization
                                  ?.language_communication || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Social behaviour
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.social_behaviour"
                                value={
                                  editData?.assessment?.socialization
                                    ?.social_behaviour || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe interactions with others and social adaptability"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization
                                  ?.social_behaviour || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Mobility in the nieghborhood
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.mobility"
                                value={
                                  editData?.assessment?.socialization
                                    ?.mobility || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to navigate and move around in familiar areas"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization?.mobility ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cognitive */}
                    {activeEducationSubsection === "cognitive" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Cognitive
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Attention
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.attention"
                                value={
                                  editData?.assessment?.cognitive?.attention ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe attention span and focus capabilities"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive?.attention ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Identification of familiar objects
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.identification_of_objects"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.identification_of_objects || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to recognize and name common objects"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.identification_of_objects || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Use of familiar objects
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.use_of_objects"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.use_of_objects || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to appropriately use common objects"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.use_of_objects || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Following simple instruction
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.following_instruction"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.following_instruction || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to understand and follow basic instructions"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.following_instruction || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Awareness of dangrer and hazards
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.awareness_of_danger"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.awareness_of_danger || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe understanding of dangerous situations"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.awareness_of_danger || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Concept Formation */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Concept formation (Indicate ability to match,
                            identify name wherever applicable)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Color
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.color"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.color || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to recognize and match colors"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.color || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Size
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.size"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.size || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of size concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.size || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Sex
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.sex"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.sex || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of gender concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.sex || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Shape
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.shape"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.shape || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to recognize and name shapes"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.shape || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Number
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.number"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.number || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of numbers and counting"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.number || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Time
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.time"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.time || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of time concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.time || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Money
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.money"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.money || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of money concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.money || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Academic */}
                    {activeEducationSubsection === "academic" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Academic (give brief history: class attended/attending
                          indicate class/grade/level wherever appropriate)
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Reading
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.reading"
                                value={
                                  editData?.assessment?.academic?.reading || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe reading level and comprehension"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.reading ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Writing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.writing"
                                value={
                                  editData?.assessment?.academic?.writing || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe writing abilities and skills"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.writing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Arithmetic
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.arithmetic"
                                value={
                                  editData?.assessment?.academic?.arithmetic ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe mathematical understanding and abilities"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.arithmetic ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prevocational/Domestic */}
                    {activeEducationSubsection === "prevocational" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Prevocational/Domestic (Specify ability and interest)
                        </h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          {editMode ? (
                            <input
                              type="text"
                              name="assessment.prevocational.ability_and_interest"
                              value={
                                editData?.assessment?.prevocational
                                  ?.ability_and_interest || ""
                              }
                              onChange={handleEditChange}
                              placeholder="Describe prevocational skills and domestic abilities"
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.prevocational
                                ?.ability_and_interest || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Items of interest
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.prevocational.items_of_interest"
                                value={
                                  editData?.assessment?.prevocational
                                    ?.items_of_interest || ""
                                }
                                onChange={handleEditChange}
                                placeholder="List activities and objects that interest the student"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.prevocational
                                  ?.items_of_interest || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Items of dislike
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.prevocational.items_of_dislike"
                                value={
                                  editData?.assessment?.prevocational
                                    ?.items_of_dislike || ""
                                }
                                onChange={handleEditChange}
                                placeholder="List activities and objects that the student dislikes"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.prevocational
                                  ?.items_of_dislike || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Info */}
                    {activeEducationSubsection === "other-info" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Additional Information
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Any peculiar behaviour/behaviour problems observed
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.behaviour_problems"
                              value={
                                editData?.assessment?.behaviour_problems || ""
                              }
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Describe any unusual behaviors or behavioral concerns observed"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.behaviour_problems || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Any other
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.any_other"
                              value={editData?.assessment?.any_other || ""}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Add any additional observations or comments"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.any_other || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Recommendation
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.recommendation"
                              value={editData?.assessment?.recommendation || ""}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Provide detailed recommendations for support and intervention"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.recommendation || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Information */}
                {activeCaseSection === "medical" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      Medical Information
                    </h2>
                    <div className="space-y-6">
                      {/* Medical Status */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Medical Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Specific Diagnostic
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="specific_diagnostic"
                                value={editData?.specific_diagnostic || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.specific_diagnostic || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Medical Conditions
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="medical_conditions"
                                value={editData?.medical_conditions || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                placeholder="Comma-separated"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(student?.medical_conditions || "")
                                  .toString()
                                  .split(",")
                                  .filter(Boolean)
                                  .map((c, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#170F49]"
                                    >
                                      {c.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              On Regular Drugs
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="is_on_regular_drugs"
                                value={editData?.is_on_regular_drugs || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.is_on_regular_drugs || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Drug History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Drug History
                        </h3>
                        <p className="text-[#170F49] mb-4">
                          {student?.is_on_regular_drugs
                            ? student.is_on_regular_drugs
                            : "N/A"}
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse rounded-xl overflow-hidden">
                            <thead className="bg-[#E38B52]/10">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  S.No
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Name of drug
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                  Dose
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/70">
                              {(student?.drug_history || []).map((d, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-[#E38B52]/10"
                                >
                                  <td className="px-4 py-3 text-sm text-[#170F49]">
                                    {i + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-[#170F49]">
                                    {d?.name || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-[#170F49]">
                                    {d?.dose || "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Allergies
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Drug Allergy
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="drug_allergy"
                                value={editData?.drug_allergy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.drug_allergy || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Food Allergy
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="food_allergy"
                                value={editData?.food_allergy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.food_allergy || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Other Allergies
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="allergies"
                                value={editData?.allergies || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.allergies || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {activeCaseSection === "documents" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Documents
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                            <div>
                              <p className="font-medium text-[#170F49]">
                                Medical Assessment Report
                              </p>
                              <p className="text-sm text-[#6F6C90]">
                                Updated on: 10 Jan 2024
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                            <div>
                              <p className="font-medium text-[#170F49]">
                                Disability Certificate
                              </p>
                              <p className="text-sm text-[#6F6C90]">
                                Updated on: 5 Dec 2023
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons with adjusted margin */}
          <div className="flex gap-4 mt-6 md:mt-8">
            {editMode ? (
              <>
                <button
                  className="flex-1 bg-gray-300 py-4 rounded-2xl font-medium"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl font-medium"
                  onClick={handleEditSave}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {activeTab === "student-details" && (
                  <>
                    <button
                      className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#E38B52]/90 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                      onClick={handleEditStart}
                    >
                      Edit Details
                    </button>
                    <button
                      className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200"
                      onClick={handleDownloadProfile}
                    >
                      Download Profile
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(100px, -100px) scale(1.2);
          }
          50% {
            transform: translate(0, 100px) scale(0.9);
          }
          75% {
            transform: translate(-100px, -50px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animation-delay-3000 {
          animation-delay: -5s;
        }
        .animation-delay-5000 {
          animation-delay: -10s;
        }
        .animation-delay-7000 {
          animation-delay: -15s;
        }

        @keyframes float-particle {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(var(--tx), var(--ty)) scale(0.8);
          }
        }

        .particle-1,
        .particle-2,
        .particle-3 {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          --tx: 10px;
          --ty: -10px;
          animation: float-particle 3s infinite ease-in-out;
        }

        .particle-2 {
          top: 50%;
          right: 20%;
          --tx: -15px;
          --ty: 5px;
          animation: float-particle 4s infinite ease-in-out;
        }

        .particle-3 {
          bottom: 20%;
          left: 50%;
          --tx: 5px;
          --ty: 15px;
          animation: float-particle 5s infinite ease-in-out;
        }
      `}</style>
      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#170F49] mb-2">
              {student?.name || "Student"}
            </h2>
            <p className="text-sm text-[#6F6C90] mb-6">
              {fromDate || "Any time"} — {toDate || "Any time"}
            </p>
            <div className="mb-4 text-sm text-[#333]">
              Showing {Math.min(reports.length, visibleCount)} of{" "}
              {reports.length} reports
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Move the button component INSIDE the main div */}
      <DynamicScrollButtons />   {" "}
    </div>
  );
};

export default StudentPage;
