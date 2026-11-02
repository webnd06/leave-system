<script setup>
import { ref, onMounted } from 'vue'
import liff from '@line/liff'
import { LIFF_ID, GAS_URL } from './config'

const name = ref('')
const userId = ref('')

const leaveType = ref('')
const startDate = ref('')
const endDate = ref('')
const reason = ref('')
const role = ref('USER')

const msg = ref('初始化中...')

const histories = ref([])
const pendingList = ref([])

onMounted(async () => {

  await liff.init({
    liffId: LIFF_ID
  })

  const profile =
      await liff.getProfile()

  name.value =
      profile.displayName

  userId.value =
      profile.userId

  msg.value =
      'LIFF初始化成功'

  const roleResponse =
      await fetch(
          `${GAS_URL}?action=role&userId=${userId.value}`
      )

  role.value =
      await roleResponse.text()
})

async function submitLeave() {

  try {

    alert("開始送出")

    const payload = {
      userId: userId.value,
      name: name.value,
      leaveType: leaveType.value,
      startDate: startDate.value,
      endDate: endDate.value,
      reason: reason.value
    }

    const formData = new FormData()

    formData.append(
        'data',
        JSON.stringify(payload)
    )

    const response = await fetch(
        GAS_URL,
        {
          method: 'POST',
          body: formData
        }
    )

    alert("fetch完成")

  }
  catch (e) {

    alert(
        "error=" + e.message
    )

    console.error(e)

  }

}

async function loadHistory() {

  try {

    const url =
        `${GAS_URL}?action=history&userId=${userId.value}`

    alert(url)

    const response =
        await fetch(url)

    alert(
        'status=' +
        response.status
    )

    histories.value =
        await response.json()

    alert(
        "筆數=" +
        histories.value.length
    )

  }
  catch(e) {

    alert(
        'error=' +
        e.message
    )

  }

}

async function cancelLeave(
    leaveId
){

  if(
      !confirm('確定撤銷嗎？')
  ){
    return
  }

  const formData =
      new FormData()

  formData.append(
      'data',
      JSON.stringify({

        action:'cancel',

        leaveId

      })
  )

  await fetch(
      GAS_URL,
      {

        method:'POST',

        body:formData

      }
  )

  await loadHistory()

}
//主管相關
async function loadPending() {

  const response =
      await fetch(
          `${GAS_URL}?action=pending`
      )

  pendingList.value =
      await response.json()

}
async function approveLeave(
    leaveId
) {

  const formData =
      new FormData()

  formData.append(
      'data',
      JSON.stringify({
        action:'approve',
        leaveId
      })
  )

  await fetch(
      GAS_URL,
      {
        method:'POST',
        body:formData
      }
  )

  await loadPending()

}
async function rejectLeave(
    leaveId
) {

  const formData =
      new FormData()

  formData.append(
      'data',
      JSON.stringify({
        action:'reject',
        leaveId
      })
  )

  await fetch(
      GAS_URL,
      {
        method:'POST',
        body:formData
      }
  )

  await loadPending()

}
</script>

<template>

  <h2>LINE請假系統</h2>

  <div>姓名：{{ name }}</div>

  <div>LINE ID：{{ userId }}</div>

  <div>

    角色：

    {{ role }}

  </div>

  <hr>

  <div>

    <label>假別</label>

    <select v-model="leaveType">

      <option value="">
        請選擇
      </option>

      <option value="特休">
        特休
      </option>

      <option value="事假">
        事假
      </option>

      <option value="病假">
        病假
      </option>

    </select>

  </div>

  <br>

  <div>

    <label>開始日期</label>

    <input
        type="date"
        v-model="startDate">

  </div>

  <br>

  <div>

    <label>結束日期</label>

    <input
        type="date"
        v-model="endDate">

  </div>

  <br>

  <div>

    <label>請假原因</label>

    <textarea
        rows="4"
        cols="30"
        v-model="reason">
  </textarea>

  </div>
  <div v-if="role==='ADMIN'">

    <hr>

    <button @click="loadPending">

      待審核清單

    </button>

  </div>
  <br>

  <button @click="submitLeave">
    送出請假單
  </button>

  <br>

  <button @click="loadHistory">

    我的請假紀錄

  </button>

  <hr>

  <h3>請假紀錄</h3>

  <div
      v-for="(item,index) in histories"
      :key="index"
  >
    <div><button
        v-if="item.status=='待審核'"
        @click="cancelLeave(item.leaveId)"
    >
      撤銷
    </button></div>

    <div>

      申請單號：
      {{ item.leaveId }}

    </div>

    <div>

      假別：
      {{ item.leaveType }}

    </div>

    <div>

      日期：
      {{ item.startDate }}
      ~
      {{ item.endDate }}

    </div>

    <div>

      原因：
      {{ item.reason }}

    </div>

    <div>

      狀態：
      {{ item.status }}

    </div>

    <hr>

  </div>

  <div
      v-for="item in pendingList"
      :key="item.leaveId"
  >

    <hr>

    <div>
      員工：
      {{ item.userName }}
    </div>

    <div>
      假別：
      {{ item.leaveType }}
    </div>

    <div>
      日期：
      {{ item.startDate }}
      ~
      {{ item.endDate }}
    </div>

    <div>
      原因：
      {{ item.reason }}
    </div>

    <button
        @click="approveLeave(item.leaveId)"
    >
      核准
    </button>

    <button
        @click="rejectLeave(item.leaveId)"
    >
      退回
    </button>

  </div>
</template>