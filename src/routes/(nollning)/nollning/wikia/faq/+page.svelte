<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import FAQuestion from "./FAQuestion.svelte";
  const questionsSV = [
    {
      title: "Hur funkar biljetter?",
      desc: "Vid biljettsläppet så ställer man sig i ett lotteri under första minuten av släppet. När minuten är slut får du notis om du tilldelades möjlighet att köpa biljett eller inte. Du har då fem minuter på dig att köpa den reserverade biljetten. Om du inte har köpt biljett inom fem minuter så går biljetten vidare till nästa i kön.",
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
  const questionsEN: typeof questionsSV = [];
  $: questions = languageTag() === "en" ? questionsEN : questionsSV;
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
