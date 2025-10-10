<template>
  <Navibar></Navibar>
  <main>
    <router-view></router-view>
  </main>
  <footer>
    <Footer></Footer>
  </footer>
  <Toast position="bottom-right" />
  <ConfirmPopup></ConfirmPopup>
</template>
