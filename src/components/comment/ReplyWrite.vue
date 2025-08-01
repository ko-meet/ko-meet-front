<template>
	<!-- replydialog -->
	<div class="modal reply--dialog" tabindex="-1" role="dialog" @click.self="closeModal">
		<div class="modal-content">
			<div class="modal-header">
				<!-- 등록 -->
				<div class="item__fnc right">
					<button type="button" class="button-icon__s button--post_upload" @click="commentApi">
						<svg viewBox="0 0 16 16">
							<path :d="postRegistrationIcon.first" />
							<path :d="postRegistrationIcon.second" />
						</svg>
						<span>등록</span>
					</button>
				</div>
				<button type="button" class="button-icon button--close" @click="closeModal">
					<i class="blind">닫기</i>
				</button>
			</div>
			<div class="modal-body">
				<div class="post-wrap">
					<div class="post__wrap">
						<textarea v-model="textareaContent" class="text__area" name="content" autocomplete="off"
							:placeholder="t('replyWrite.replyWritePlaceholder')" data-autosuggest_is-input="true" ref="textareaRef"
							@input="adjustTextareaHeight" rows="2"></textarea>
						<!-- <textarea v-model="content" class="text__area" name="content" autocomplete="off"
							placeholder="댓글을 입력해주세요. 다른 사용자로부터 일정 수 이상의 신고를 받는 경우 글이 자동으로 숨김처리 될 수 있습니다."
							data-autosuggest_is-input="true" ref="textareaRef" @input="adjustTextareaHeight" rows="2"></textarea> -->
					</div>
					<!-- <div class="util__wrap">
						<div class="item__fnc">
							<div class="input__wrap input__attachments">
								<div class="input__file">
									<input type="file" id="file-upload" multiple="multiple"
										accept="image/jpeg, image/png, image/gif, image/jpg, image/tiff" @change="previewImage" />
									<label for="file-upload" class="button-icon__s" role="button">
										<svg viewBox="0 0 16 16">
											<path
												d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z" />
											<path
												d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
										</svg>
										<i class="blind">사진 선택</i>
									</label>
								</div>
							</div>
						</div>
					</div> -->
				</div>
			</div>
		</div>
	</div>
	<CustomAlert v-if="alertValue" :alertValue="alertValue" :alertText="alertText" @update:alertValue="closeAlert" />
	<LoadingModal v-if="isLoading" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { postRegistrationIcon } from '@/utils/icons.ts';
import { applicationJsonWithToken } from '@/utils/header';
import { useUserInfoStore } from '@/stores/userInfo';
import { AxiosResponse } from 'axios';
import { useI18n } from 'vue-i18n';
import CustomAlert from '@/components/modal/CustomAlert.vue';
import LoadingModal from '@/components/loading/LoadingModal.vue';
import api from '@/api';

const { t } = useI18n();

const userInfo = useUserInfoStore();
const alertValue = ref(false);
const alertText = ref('');
const isLoading = ref(false);

const emit = defineEmits(['close']);

const props = defineProps({
	postSeq: {
		type: Number,
		required: false,
	},
	commentSeq: {
		type: Number,
		required: false,
	},
	isPostComment: {
		type: Boolean,
		required: true,
	},
	taggedUser: {
		type: String,
		required: false,
	},
});

const closeModal = () => {
	emit('close');
};

const openAlert = (content: string) => {
	alertValue.value = true;
	alertText.value = content;
};

const closeAlert = () => {
	alertValue.value = false;
};

// textarea
// 데이터 바인딩을 위한 ref
const textareaContent = ref('');

// DOM 요소를 참조하기 위한 ref
const textareaRef = ref<HTMLElement | null>(null);

const adjustTextareaHeight = () => {
	const textarea = textareaRef.value; // ref에서 실제 DOM 요소를 가져옴
	if (textarea) {
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}
};
const commentApi = async () => {
	onLoading();
	// 댓글 등록 api
	if (props.isPostComment) {
		callCommentApi();
	} else {
		callReplyApi();
	}
	setTimeout(() => {
		offLoading();
		closeModal();
	}, 1000);
};

const callCommentApi = async () => {
	try {
		const requestForm = {
			content: (textareaRef.value as HTMLTextAreaElement)?.value,
		}
		const response: AxiosResponse<void> = await api.post(
			`/comments/post/${props.postSeq}/users/${userInfo.userSeq}`,
			requestForm,
			applicationJsonWithToken(userInfo.accessToken),
		);
		if (response.status === 201) {
			// 댓글 등록 성공
		}
	} catch (error) {
		openAlert('서버와의 통신에 실패했습니다.');
		console.error(error);
	}
};
const callReplyApi = async () => {
	try {
		const requestForm = {
			content: (textareaRef.value as HTMLTextAreaElement)?.value,
		}
		const response: AxiosResponse<void> = await api.post(
			`/replies/comments/${props.commentSeq}`,
			requestForm,
			applicationJsonWithToken(userInfo.accessToken),
		);
		if (response.status === 201) {
			// 대댓글 등록 성공
		}
	} catch (error) {
		openAlert('서버와의 통신에 실패했습니다.');
		console.error(error);
	}
};

const onLoading = () => {
	isLoading.value = true;
};

const offLoading = () => {
	isLoading.value = false;
};
</script>
