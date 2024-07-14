<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<header>
  <h1 class="font-nolla-mono mx-auto text-center text-8xl font-bold">
    Packlista
  </h1>
</header>

<article>
  <p>
    Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iure, corrupti
    repellat nam consequuntur sequi porro hic temporibus recusandae tenetur nemo
    rem numquam? Nam itaque mollitia in, sit illum quos eum!
  </p>
  <ul>
    <li>
      <input type="checkbox" name="robust-clothing" id="robust-clothing" />
      <h6>Oömma skor och kläder</h6>
      <p>
        Det är viktigt att ha kläder som tål att bli smutsiga och skor som är
        bekväma att gå i.
      </p>
    </li>
    <li>
      <input type="checkbox" name="theme-outfits" id="theme-outfits" />
      <h6>Lite utklädnader</h6>
      <p>
        Många fester i studentlivet har ofta tema, och då kan det vara kul att
        ha någon rolig outfit. Det går så klart att köpa här men om du har saker
        hemma kan det vara värt att ta med!
      </p>
    </li>
    <li>
      <input type="checkbox" name="dark-suit" id="dark-suit" />
      <h6>Kläder för klädkoden "Mörk kostym"</h6>
      <p>
        Se <a href="/packning#kladkod">klädkoder</a> för vad som innefattas. Vi kommer
        ha ett event med klädkoden "Mörk kostym" redan första veckan.
      </p>
    </li>
    <li>
      <input
        type="checkbox"
        name="robust-clothing"
        id="robust-clothing"
        checked
        on:click|preventDefault
      />
      <h6>Ett glatt humör</h6>
    </li>
  </ul>
  <section>
    <ul>
      <li>
        <img src="#" alt="Slasque-exempel" />
        <p>
          På med ouvven! Ibland är det dessutom ett tema för slasquen. Då får
          man gärna addera temaenlig klädsel utöver ouvven.
        </p>
      </li>
      <li>
        <img src="#" alt="Bruten kavaj exempel" />
        <p>
          Finare vardagskläder. En kavaj kombinerat med något annat, eller bara
          något som du känner dig snygg i.
          <i>(Vi har väldigt sällan denna klädkoden)</i>
        </p>
      </li>
      <li>
        <img src="#" alt="Mörk kostym exempel" />
        <p>
          En mörk kostym eller en finare klänning. Det går bra med en vanlig blå
          kostym, eller en kjol med en topp också.
        </p>
      </li>
      <li>
        <img src="#" alt="Högtidsdräktsexempel" />
        <p>Långklänning eller frack, men en mörk kostym går också bra.</p>
      </li>
    </ul>
  </section>
</article>
