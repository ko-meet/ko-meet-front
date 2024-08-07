import { ISelectItem, IUserInfo } from '@/types/interface.ts'
import { defineStore } from 'pinia'

interface UserInfoState {
  userSeq: number | null
  accessToken: string | null
  refreshToken: string | null
  userNickname: string | null
  userEmail: string | null
  userCountry: string | null
  userInterestCountry: string | null
  userRegion: string | null
  userProfileUrl: string | null
  isLocationMatch: boolean
  unreadNotification: boolean
}

export const useUserInfoStore = defineStore('userInfo', {
  state: (): UserInfoState => ({
    userSeq: null,
    accessToken: null,
    refreshToken: null,
    userNickname: null,
    userEmail: null,
    userCountry: null,
    userInterestCountry: null,
    userRegion: null,
    userProfileUrl: null,
    isLocationMatch: false,
    unreadNotification: false
  }),
  actions: {
    setUserInfo(userInfo: IUserInfo | null | undefined): void {
      if (!userInfo) {
        return
      }
      this.userSeq = userInfo.userSeq
      this.accessToken = userInfo.accessToken
      this.refreshToken = userInfo.refreshToken
      this.userNickname = userInfo.nickname
      this.userEmail = userInfo.email
      this.userCountry = userInfo.country
      this.userInterestCountry = userInfo.interestCountry
      this.userRegion = userInfo.region
      this.userProfileUrl = userInfo.userProfileUrl
      this.isLocationMatch = userInfo.isLocationMatch
    },
    signOut(): void {
      this.userSeq = null
      this.accessToken = null
      this.refreshToken = null
      this.userNickname = null
      this.userEmail = null
      this.userCountry = null
      this.userInterestCountry = null
      this.userRegion = null
      this.userProfileUrl = null
      this.isLocationMatch = false
    },
    setUnreadNotification(unreadNotification: boolean): void {
      this.unreadNotification = unreadNotification
    },
    setUserInterestCountry(userInterestCountry: string): void {
      this.userInterestCountry = userInterestCountry
    },
    setLocationMatch(isLocationMatch: boolean): void {
      this.isLocationMatch = isLocationMatch
    }
  }
})
