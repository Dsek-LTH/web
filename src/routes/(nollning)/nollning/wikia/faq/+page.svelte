<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import FAQuestion from "./FAQuestion.svelte";

  const questionsSV = [
    // {
    //   title: "Hur funkar biljetter?",
    //   desc: "Vid biljettsläppet så ställer man sig i ett lotteri under första minuten av släppet. När minuten är slut får du notis om du tilldelades möjlighet att köpa biljett eller inte. Du har då fem minuter på dig att köpa den reserverade biljetten. Om du inte har köpt biljett inom fem minuter så går biljetten vidare till nästa i kön.",
    // },
    {
      title: "Hur funkar biljetter?",
      desc: "Biljetter köps på ORBI, se till att du är medlem i D-sektionen Nollor 2024. Ditt efternamn ska vara din phaddergrupp.",
    },
    {
      title: "Måste jag vara med på allt under nollningen?",
      desc: "Nej, du är med på precis så mycket du vill! Nollningen ska vara kul. Är det något evenemang du inte känner är din grej eller känner du dig helt enkelt för trött för att gå är det helt fine att skippa.",
    },
    {
      title: "Vad kostar det att delta på nollningen?",
      desc: "Många av aktiviteterna är helt gratis att delta på medan vissa event och sittningar har ett (studentvänligt) biljettpris. Ibland kommer det säljas mat, ibland bjuds det på mat, all viktig information om eventet kommer finnas tillgänglig. ",
    },
    {
      title: "Vad är en sittning?",
      desc: "En sittning är en festlig tillställning där det äts och dricks och sjungs en massa ur sångboken! Extra roligt blir det om folk går upp på scen och gycklar. Det finns fulsittningar (slasque) och finsittningar och under nollningen kommer ni få uppleva båda.",
    },
    {
      title: "Hur mycket måste jag plugga?",
      desc: "Det är väldigt individuellt hur mycket tid man behöver lägga ner för att nå de resultat man vill beroende på vilka erfarenheter och kunskaper man har med sig från gymnasiet och andra tidigare studier. Det är dock vanligt att man behöver lägga ner lite mer tid det första året innan man har hittat sin studieteknik och vant sig vid universitetsstudierna. Civilingenjörsutbildningar ses ofta som en av de mest tidskrävande utbildningar, vilket nog ofta är sant. Men frukta ej! Man får mycket stöd av lärare och övningar, kursare och studentlivet, och det finns otroligt mycket roligt att göra vid sidan om studierna.",
    },
    {
      title: "Vad händer om man inte klarar en tenta?",
      desc: "Inte så mycket! Även om det såklart är att föredra att klara tentan på första försöket är det vanligt att studenter kuggar en tenta och det finns flera perioder under året då man kan skriva omtentor (omtentaperioder). En vid påsk och en i augusti innan skolstart. En omtenta är precis som en vanlig tenta, och man kan fortfarande få alla betyg.",
    },
  ];
  const questionsEN: typeof questionsSV = [
    // {
    //   title: "How do tickets work?",
    //   desc: "When tickets are released, you enter a lottery during the first minute of the release. Once the minute is over, you'll be notified if you were given the opportunity to buy a ticket or not. You then have five minutes to purchase the reserved ticket. If you don't buy the ticket within five minutes, it will be passed on to the next person in line.",
    // },
    {
      title: "How do tickets work?",
      desc: "Tickets are bought on ORBI, make sure you have a membership in D-sektionen Nollor 2024. Your last name should be your phadder group.",
    },
    {
      title: "Do I have to participate in everything during nollningen?",
      desc: "No, you can participate as much or as little as you want! Nollningen is meant to be fun. If there's an event that doesn't feel like your thing, or if you're simply too tired to go, it's completely fine to skip it.",
    },
    {
      title: "How much does it cost to participate in nollningen?",
      desc: "Many of the activities are completely free to join, while certain events and sittings have a (student-friendly) ticket price. Sometimes food will be sold, and other times food will be provided for free. All the important information about the event will be available.",
    },
    {
      title: "What is a sitting?",
      desc: "A sitting is a festive gathering where you eat, drink, and sing a lot from the songbook! It's even more fun if people get up on stage and perform. There are casual sittings (slasque) and formal sittings, and during nollningen, you'll get to experience both.",
    },
    {
      title: "How much do I need to study?",
      desc: "It varies greatly depending on your background and the knowledge you bring from high school and other previous studies. However, it's common to need to put in a bit more time during the first year before you've found your study technique and gotten used to university studies. Engineering programs are often considered some of the most time-consuming studies, which is often true. But don't worry! You get a lot of support from teachers, exercises, classmates, and student life, and there are plenty of fun things to do alongside your studies.",
    },
    {
      title: "What happens if you don't pass an exam?",
      desc: "Not much! While it's of course preferable to pass the exam on the first try, it's common for students to fail an exam, and there are several periods throughout the year when you can retake exams (retake periods). One during Easter and one in August before the school year starts. A retake exam is just like a regular exam, and you can still get any grade.",
    },
  ];
  let questions = $derived(languageTag() === "en" ? questionsEN : questionsSV);
</script>

<!-- limit width and center -->
<div class="mx-auto max-w-screen-md">
  <!-- default none opened -->
  <section class="space-y-4">
    {#each questions as question}
      <FAQuestion title={question.title} body={question.desc} />
    {/each}
  </section>
</div>
