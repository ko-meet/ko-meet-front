<template>
  <LoadingModal v-if="isLoading" />
  <TheHeader :showNotification="false" />
  <div class="content">
    <TheTopBox
      :title="t('profileEditView.profileEdit')"
      :text="t('profileEditView.profileEditText')"
    />
    <div class="container">
      <!-- userProfileUrl -->
      <div class="input-wrap">
        <div class="input__wrap input__attachments _edit">
          <div class="input__item">
            <div class="input__item_inner">
              <div class="input__file">
                <input type="file" id="file-upload" class="input__element" @change="previewImage" />
                <label for="file-upload" class="button" role="button">
                  <span class="blind">프로필 사진 선택</span>
                </label>
              </div>
              <div class="item__display" :class="{ 'image--default': !imagePreview }">
                <img v-if="imagePreview" :src="imagePreview" alt="Preview" />
                <button type="reset" class="button--del" @click="removeImage">
                  <i class="blind">삭제</i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- nickname -->
      <div class="input-wrap">
        <em class="input__title">{{ t('profileEditView.nicknameChange') }}</em>
        <!-- input__wrap -->
        <div class="input__wrap underline-type">
          <div class="input__item">
            <div class="input__item_inner">
              <input
                v-model="userNickName"
                type="text"
                class="input__element"
                :placeholder="t('profileEditView.nicknameChangePlaceHolder')"
              />
            </div>
          </div>
          <button type="button" class="button button--primary" @click="checkNickName">
            {{ t('signUpView.duplicationCheck') }}
          </button>
        </div>
        <!-- 에러 메시지 -->
        <p
          v-if="nickNameCheckDone && !isNickNameValid && isNickNameChanged"
          class="input__error"
          aria-live="assertive"
        >
          {{ t('signUpView.alreadyInUse') }}
        </p>
        <p
          v-if="!nickNameCheckDone && !isNickNameValid && isNickNameChanged"
          class="input__error"
          aria-live="assertive"
        >
          {{ t('signUpView.doDuplicationCheck') }}
        </p>
        <p
          v-if="nickNameCheckDone && isNickNameValid && isNickNameChanged"
          class="input__text"
          aria-live="assertive"
        >
          {{ t('signUpView.availableNickname') }}
        </p>
      </div>
      <!-- country -->
      <div class="input-wrap">
        <em class="input__title">{{ t('profileEditView.changeCountry') }}</em>
        <!-- input__wrap -->
        <div class="input__wrap underline-type">
          <div class="input__item">
            <div class="input__item_inner">
              <input
                v-model="country"
                type="text"
                class="input__element"
                :placeholder="t('profileEditView.country')"
                disabled
              />
            </div>
          </div>
          <button type="button" class="button button--primary" @click="fetchLocation">
            {{ t('profileEditView.fetchLocation') }}
          </button>
        </div>
      </div>
      <!-- interested country -->
      <div class="input-wrap">
        <em class="input__title">{{ t('profileEditView.changeInterestedCountry') }}</em>
        <!-- input__wrap -->
        <div class="input__wrap underline-type">
          <div class="input__item">
            <div class="input__item_inner" @click="openSelect">
              <input
                v-model="interestCountry"
                type="text"
                class="input__element"
                :placeholder="t('profileEditView.interestCountry')"
                readonly
              />
            </div>
          </div>
        </div>
      </div>

      <div class="button-wrap">
        <button class="button" :class="buttonClass" @click="saveProfile">
          {{ t('profileEditView.save') }}
        </button>
      </div>
    </div>
  </div>
  <SelectDialog
    v-if="isCountrySelectClicked"
    :title="countrySelectTitle"
    :list="countries"
    @close="closeSelect"
    @select:value="selectedValue"
  />
  <teleport to="#modal" v-if="alertValue">
    <CustomAlert :alertValue="alertValue" :alertText="alertText" @update:alertValue="closeAlert" />
  </teleport>
</template>

<script setup lang="ts">
import type { IApiImage, IApiLocation, IApiResponse } from '@/types/api-interface'
import type { ILocation, ISelectItem } from '@/types/interface'
import { applicationJson, applicationJsonWithToken, multipartFormData } from '@/utils/header'
import { computed, onMounted, ref } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo.ts'
import { useLocationStore } from '@/stores/location.ts'
import { resizeImage } from '@/utils/image.ts'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { countries } from '@/utils/selectItems'
import { AxiosResponse } from 'axios'
import LoadingModal from '@/components/loading/LoadingModal.vue'
import TheHeader from '@/components/layouts/TheHeader.vue'
import TheTopBox from '@/components/search/TheTopBox.vue'
import SelectDialog from '@/components/selections/SelectDialog.vue'
import CustomAlert from '@/components/modal/CustomAlert.vue'
import api from '@/api'

const { t } = useI18n()

const router = useRouter()
const nickNameCheckDone = ref(false)
const isNickNameValid = ref(false)
const userInfo = useUserInfoStore()
const userNickName = ref()
const country = ref()
const countryCode = ref()
const interestCountry = ref()
const interestCountryCode = ref()
const isCountrySelectClicked = ref(false)
const countrySelectTitle = t('profileEditView.selectCountry')
const imagePreview = ref()
const imageUrl = ref()
const imageFile = ref(null)
const latitude = ref(parseFloat(localStorage.getItem('latitude') ?? '0.0'))
const longitude = ref(parseFloat(localStorage.getItem('longitude') ?? '0.0'))
const isLoading = ref(false)

const isNickNameChanged = computed(() => {
  return userNickName.value !== userInfo.userNickname
})

const isInterestCountryChanged = computed(() => {
  return interestCountry.value !== userInfo.userInterestCountry
})

const isCountryChanged = computed(() => {
  return countryCode && countryCode.value !== userInfo.userCountry
})

const buttonClass = computed(() => {
  if (
    isInterestCountryChanged.value ||
    (nickNameCheckDone.value && isNickNameValid.value && isNickNameChanged.value) ||
    isImageChanged.value ||
    isCountryChanged.value
  ) {
    return 'button--positive'
  } else {
    return 'button--disabled'
  }
})

const isImageChanged = computed(() => {
  return imagePreview.value !== userInfo.userProfileUrl
})

// 프리뷰 이미지
const previewImage = (event: { target: any }) => {
  const input = event.target
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target) {
        imagePreview.value = e.target.result
      }
      imageFile.value = input.files[0]
    }
    reader.readAsDataURL(input.files[0])
  }
}

// 프리뷰이미지 삭제
const removeImage = () => {
  // 비어있는 이미지로 설정
  imagePreview.value = ''
  imageFile.value = null
  imageUrl.value = ['']
}

// 닉네임 중복 체크
const checkNickName = async () => {
  if (userNickName.value == userInfo.userNickname) {
    isNickNameValid.value = true
    nickNameCheckDone.value = true
    return
  }
  try {
    const { status, data } = await api.get(
      `/users/nicknames?nickname=${userNickName.value}`,
      applicationJson
    )
    if (status === 200) {
      isNickNameValid.value = data.data ? true : false
      nickNameCheckDone.value = true
    }
  } catch (error) {
    console.log(error)
  }
}

const hostImage = async () => {
  if (!imagePreview.value || !imageFile.value) {
    return;
  }
  try {
    const formData = new FormData();
    const resizedImage = await resizeImage(imageFile.value, 0.5);
    
    formData.append("multipartFile", resizedImage as Blob);
    formData.append("imagePath", "profile");
    formData.append("imageType", "PROFILE");

    const response: AxiosResponse<IApiImage> = await api.post(
      "/images",
      formData,
      multipartFormData
    );

    if (response.status === 200) {
      console.log("Image Upload Response:", response.data);  // 🔍 디버깅 로그 추가
      imageUrl.value = response.data.data;  // 🔥 여기서 값이 정상적으로 들어가야 함
    } else {
      openAlert(t("profileEditView.failedToUploadImage"));
    }
  } catch (error) {
    console.log(error);
  }
};



const saveProfile = async () => {
  if (imageFile.value) {
    await hostImage()
  }
  const formData = {
    nickName: userNickName.value === userInfo.userNickname ? null : userNickName.value,
    country: country.value === userInfo.userCountry ? null : countryCode.value,
    interestCountry:
      !interestCountry.value && interestCountry.value === userInfo.userInterestCountry
        ? null
        : interestCountryCode.value,
    profileImage: isImageChanged ? imageUrl.value[0] : null,
    latitude: latitude.value,
    longitude: longitude.value
  }
  try {
    const response: AxiosResponse<IApiResponse> = await api.patch(
      `/users/${userInfo.userSeq}/information`,
      formData,
      applicationJsonWithToken(userInfo.accessToken)
    )
    if (response.status === 200) {
      if (isNickNameChanged.value) {
        userInfo.userNickname = userNickName.value
      }
      if (isImageChanged.value) {
        userInfo.userProfileUrl = imagePreview.value
      }
      if (isCountryChanged.value) {
        userInfo.userCountry = countryCode.value
      }
      if (isInterestCountryChanged.value) {
        userInfo.userInterestCountry = interestCountryCode.value
      }
      router.back()
    }
  } catch (error) {
    console.log(error)
  }
}

// <-- 알럿 관련
const alertValue = ref(false)
const alertText = ref('')

const openAlert = (content: string) => {
  alertValue.value = true
  alertText.value = content
}

const closeAlert = () => {
  alertText.value = ''
  alertValue.value = false
}
// -->

// select 관련 메소드
const openSelect = (event: Event) => {
  event.preventDefault()
  isCountrySelectClicked.value = true
  isModalOpen()
}

const closeSelect = () => {
  isCountrySelectClicked.value = false
  isModalClose()
}

// select 관련 메소드 (선택된 값 처리)
const selectedValue = (value: ISelectItem) => {
  if (countries.some((c) => c.code === value.code)) {
    interestCountry.value = t('countries.' + value.code)
    interestCountryCode.value = value.code
  }
}

// modal open/close 시 body 컨트롤
const isModalOpen = () => {
  document.body.classList.add('inactive')
}
const isModalClose = () => {
  document.body.classList.remove('inactive')
}

const options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
}

const errorCallback = (error: { code: any; message: any }) => {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

const fetchLocation = async () => {
  try {
    isLoading.value = true
    if ('geolocation' in navigator) {
      const permissionResult = await navigator.permissions.query({
        name: 'geolocation'
      })
      if (permissionResult.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            getCountry({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            useLocationStore().setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            isLoading.value = false
          },
          errorCallback,
          options
        )
      } else if (permissionResult.state === 'prompt') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options)
        })
        getCountry({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        isLoading.value = false
      } else if (permissionResult.state === 'denied') {
        console.error('Geolocation permission denied.')
        isLoading.value = false
      }
    }
  } catch (error) {
    console.error('Failed to get location:', error)
    isLoading.value = false
  } finally {
    isLoading.value = false
  }
}

const setCountryCoordinates = async (location: ILocation) => {
  latitude.value = location.latitude ? location.latitude : 0.0
  longitude.value = location.longitude ? location.longitude : 0.0
}

const getCountry = async (location: ILocation) => {
  setCountryCoordinates({
    latitude: location.latitude,
    longitude: location.longitude
  })
  try {
    const response: AxiosResponse<IApiLocation> = await api.get(
      `/locations?latitude=${location.latitude}&longitude=${location.longitude}`,
      multipartFormData
    )
    if (response.status === 200) {
      country.value = t('countries.' + response.data.data.country)
      countryCode.value = response.data.data.country
    } else {
      openAlert(t('profileEditView.failedToFetchLocationInfo'))
    }
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  userNickName.value = userInfo.userNickname
  country.value = t('countries.' + userInfo.userCountry)
  countryCode.value = userInfo.userCountry
  imagePreview.value = userInfo.userProfileUrl
  if (userInfo.userInterestCountry) {
    interestCountry.value = t('countries.' + userInfo.userInterestCountry)
  } else {
    interestCountry.value = ''
  }
})
</script>
