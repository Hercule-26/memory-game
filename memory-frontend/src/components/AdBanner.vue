<template>
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-8743731971392703"
       data-ad-slot="1234567890"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</template>

<script>
export default {
  name: "AdBanner",
  mounted() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }
};
</script>