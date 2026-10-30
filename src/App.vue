<script setup>
import { ref, onMounted } from 'vue'
import liff from '@line/liff'

import { LIFF_ID } from './config'

const name = ref('')
const userId = ref('')
const msg = ref('初始化中...')

onMounted(async () => {

  try {

    await liff.init({
      liffId: LIFF_ID
    })

    msg.value =
        'LIFF初始化成功'

    if (!liff.isLoggedIn()) {

      msg.value =
          '尚未登入'

      return
    }

    const profile =
        await liff.getProfile()

    name.value =
        profile.displayName

    userId.value =
        profile.userId

  }
  catch (e) {

    msg.value =
        e.message

    console.error(e)

  }

})
</script>

<template>

  <h1>LINE請假系統</h1>

  <div>{{ msg }}</div>

  <div>姓名：{{ name }}</div>

  <div>LINE ID：{{ userId }}</div>

</template>