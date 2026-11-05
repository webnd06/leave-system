<script setup>
import {ref, onMounted} from 'vue'
import liff from '@line/liff'
import {LIFF_ID, GAS_URL} from './config'

const name = ref('')
const userId = ref('')

const leaveType = ref('')
const startDate = ref('')
const endDate = ref('')
const reason = ref('')
const role = ref('USER')
const currentTab =
    ref('apply')

const msg = ref('初始化中...')

const histories = ref([])
const pendingList = ref([])

const startTime = ref('09:00')
const endTime = ref('18:00')

const leaveHours = ref(0)

const timeOptions = []

for(let h=9; h<=18; h++){

  timeOptions.push(
      `${String(h).padStart(2,'0')}:00`
  )

  if(h !== 18){

    timeOptions.push(
        `${String(h).padStart(2,'0')}:30`
    )

  }

}

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

    const payload = {
      userId: userId.value,
      name: name.value,
      leaveType: leaveType.value,
      startDate: startDate.value,
      startTime:startTime.value,
      endDate: endDate.value,
      endTime:endTime.value,
      reason: reason.value,
      leaveHours:leaveHours.value
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

    alert(
        'status=' +
        response.status
    )

  } catch (e) {

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

  } catch (e) {

    alert(
        'error=' +
        e.message
    )

  }

}

async function cancelLeave(
    leaveId
) {

  if (
      !confirm('確定撤銷嗎？')
  ) {
    return
  }

  const formData =
      new FormData()

  formData.append(
      'data',
      JSON.stringify({

        action: 'cancel',

        leaveId,

        approver:
        name.value

      })
  )

  await fetch(
      GAS_URL,
      {

        method: 'POST',

        body: formData

      }
  )

  await loadHistory()

}

//主管相關
async function loadPending() {

  const response =
      await fetch(
          `${GAS_URL}?action=pending&userId=${userId.value}`
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
        action: 'approve',
        leaveId,

        approver:
        name.value
      })
  )

  const response = await fetch(
      GAS_URL,
      {
        method: 'POST',
        body: formData
      }
  )

  alert(
      'status=' +
      response.status
  )

  await loadPending()

}

async function rejectLeave(
    leaveId
) {

  const rejectReason =
      prompt(
          '請輸入退回原因'
      )
  if (
      !rejectReason
  ) {
    return
  }

  const formData =
      new FormData()

  formData.append(
      'data',
      JSON.stringify({
        action: 'reject',
        leaveId,
        approver:name.value,

        userId:userId.value,

        rejectReason
      })
  )


  const response = await fetch(
      GAS_URL,
      {
        method: 'POST',
        body: formData
      }
  )

  alert(
      'status=' +
      response.status
  )
  await loadPending()

}

function calculateLeaveHours() {

  const start =
      new Date(
          `${startDate.value}T${startTime.value}`
      )

  const end =
      new Date(
          `${endDate.value}T${endTime.value}`
      )

  let minutes =
      (
          end - start
      ) / 1000 / 60

  const lunchStart =
      new Date(
          `${startDate.value}T12:00`
      )

  const lunchEnd =
      new Date(
          `${startDate.value}T13:00`
      )

  const overlap =
      Math.max(
          0,
          Math.min(end, lunchEnd)
          -
          Math.max(start, lunchStart)
      )

  minutes =
      minutes -
      overlap / 1000 / 60

  leaveHours.value =
      minutes / 60
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

  <div class="menu">

    <button
        @click="currentTab='apply'">
      請假申請
    </button>

    <button
        @click="currentTab='history'">
      我的紀錄
    </button>

    <button
        v-if="role==='ADMIN'"
        @click="currentTab='approve'">
      主管審核
    </button>

  </div>

  <div v-if="currentTab==='apply'">
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
          v-model="startDate"
          @change="calculateLeaveHours"
      />

    </div>

    <br>

    <div>
      <label>開始時間</label>
      <select
          v-model="startTime"
          @change="calculateLeaveHours">

        <option
            v-for="time in timeOptions"
            :key="time"
            :value="time">

          {{ time }}

        </option>

      </select>
    </div>

    <br>
    <div>
      <label>結束日期</label>
      <input
          type="date"
          v-model="endDate"
          @change="calculateLeaveHours"
      />
    </div>

    <br>
    <div>

      <label>結束時間</label>
      <select
          v-model="endTime"
          @change="calculateLeaveHours">

        <option
            v-for="time in timeOptions"
            :key="time"
            :value="time">

          {{ time }}

        </option>

      </select>

    </div>

    <br>

    <div>

      請假時數：

      <b>
        {{ leaveHours }}
      </b>

      小時

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

    <button @click="submitLeave">
      送出請假單
    </button>

    <br>
  </div>

  <div
      v-if="
     role==='ADMIN'
     && currentTab==='approve'
  "
  >

    <button @click="loadPending">
      載入待審核
    </button>

    <!-- pendingList -->
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
        日期時間：

        {{ item.startDate }}
        {{ item.startTime }}

        ~

        {{ item.endDate }}
        {{ item.endTime }}
      </div>
      <div>

        時數：

        {{ Number(item.leaveHours).toFixed(1)  }}
        小時

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

  </div>
  <br>

  <div v-if="currentTab==='history'">

    <button @click="loadHistory">
      重新載入
    </button>
    <h3>請假紀錄</h3>

    <div
        v-for="(item,index) in histories"
        :key="index"
    >
      <div>
        <button
            v-if="item.status=='待審核'"
            @click="cancelLeave(item.leaveId)"
        >
          撤銷
        </button>
      </div>

      <div>

        申請單號：
        {{ item.leaveId }}

      </div>

      <div>

        假別：
        {{ item.leaveType }}

      </div>

      <div>

        日期時間：

        {{ item.startDate }}
        {{ item.startTime }}

        ~

        {{ item.endDate }}
        {{ item.endTime }}

      </div>

      <div>

        時數：

        {{ item.leaveHours }}
        小時

      </div>

      <div>

        原因：
        {{ item.reason }}

      </div>

      <div>

        狀態：
        {{ item.status }}

      </div>
      <div
          v-if="item.approver"
      >

        審核人：
        {{ item.approver }}

      </div>

      <div
          v-if="
    item.approveTime
  "
      >

        審核時間：
        {{ item.approveTime }}

      </div>

      <div
          v-if="
    item.status==='已退回'
    &&
    item.rejectReason
  "
      >

        退回原因：

        {{ item.rejectReason }}

      </div>

      <hr>

    </div>
  </div>

</template>