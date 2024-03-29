<template>
	<div class="item">
		<div class="info__wrap">
			<div class="item__pic" :class="{ 'pic--default': !post.userProfileUrl }">
				<img v-if="post.userProfileUrl" :src="post.userProfileUrl" alt="" />
			</div>
			<div class="item__fnc">
				<div class="list__item">
					<button type="button" class="list__item_button ctg">
						<em>{{ post.country }}</em>
						<strong>{{ post.category }}</strong>
						<span v-if="post.isPublic === 'N'" class="list__private">
							<i class="blind">내국가에만 공개 된 글</i>
						</span>
					</button>
				</div>
				<div class="list__item">
					<button type="button" class="list__item_button user">
						<em>{{ post.region }}</em>
						<strong>{{ post.userNickName }}</strong>
					</button>
				</div>
			</div>
		</div>
		<div class="text__wrap">
			<button type="button" class="list__item_button" @click="onBoardDetail(post.seq)">
				<div class="text__item">
					<p class="title" v-html="highlightKeyword(post.title, post.keyword)"></p>
					<p class="text" v-html="highlightKeyword(post.content, post.keyword)"></p>
					<div class="tag__wrap">
						<div class="tag__inner">
							<div class="tag__item">
								<span class="item--hash" v-for="tag in post.tags" :key="tag">
									<em v-html="highlightKeyword(tag, post.keyword)"></em>
								</span>
							</div>
						</div>
					</div>
				</div>
				<div class="thumb" v-if="post.attachments.length > 0">
					<img :src="thumbnail" alt="" />
				</div>
			</button>
		</div>
		<div class="util__wrap">
			<div class="item__fnc">
				<p class="list__item read">
					<i class="blind">조회수</i>
					<span class="item__count">{{ post.viewCount }}</span>
				</p>
				<button type="button" class="list__item_button like" :class="{ active: isLiked }" @click="likeApi">
					<!-- //활성화 .active -->
					<i class="blind">좋아요</i>
					<span class="item__count"> {{ likes }}</span>
				</button>
				<p class="list__item cmt">
					<i class="blind">댓글</i>
					<span class="item__count">{{ post.commentCounts }}</span>
				</p>
			</div>
			<div class="item__fnc">
				<p class="list__item past">
					<i class="blind">작성시간</i>
					<span class="item__count">{{ timeCalculation(post.createdAt) }}</span>
				</p>
				<button type="button" class="list__item_button mark" :class="{ active: isBookmarked }" @click="bookmarkApi">
					<!-- //활성화 .active -->
					<i class="blind">북마크</i>
				</button>
			</div>
		</div>
	</div>
	<!-- //.item -->
</template>

<script setup>
import { useRouter } from 'vue-router';
import useAxios from '@/composables/useAxios.js';
import { computed, ref } from 'vue';
import { useUserInfoStore } from '@/stores/userInfo';
import { timeCalculation } from '@/utils/date-time.js';

const userInfo = useUserInfoStore();
const router = useRouter();
const { sendRequest } = useAxios(router);

const props = defineProps({
	post: {
		type: Object,
		required: true,
		default: () => ({
			seq: 0,
			title: '',
			content: '',
			userSeq: 0,
			userProfileUrl: '',
			userNickName: '',
			commentCounts: 0,
			viewCount: 0,
			likeCount: 0,
			tags: [],
			attachments: [],
			likeUsers: [],
			bookmarkUsers: [],
			isPublic: '',
			country: '',
			region: '',
			status: '',
			category: '',
			keyword: '',
			createdAt: '',
		}),
	},
});

const likes = ref(props.post.likeCount);
const likeUsers = ref(props.post.likeUsers);
const bookmarkUsers = ref(props.post.bookmarkUsers);
const userSeq = ref(userInfo.userSeq);
const thumbnail = ref(
	props.post.attachments.length > 0 ? props.post.attachments[0] : '',
);
const isLiked = computed(() => {
	return likeUsers.value.includes(userSeq.value);
});

const isBookmarked = computed(() => {
	return bookmarkUsers.value.includes(userSeq.value);
});

const onBoardDetail = () => {
	increaseViewCount();
	router.push(`/board/${props.post.seq}`);
};

const likeApi = async () => {
	const token = localStorage.getItem('accessToken');
	if (!token) {
		router.push('/sign-in');
		return;
	}
	changeLike();
	try {
		await sendRequest('patch', `/posts/${props.post.seq}/like`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
			},
		});
	} catch (error) {
		console.log(error);
	}
};

const increaseViewCount = async () => {
	try {
		await sendRequest('patch', `/posts/${props.post.seq}/view`, {
			headers: {
				contentType: 'application/json',
				Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
			},
		});
	} catch (error) {
		console.log(error);
	}
};

const changeLike = () => {
	if (isLiked.value) {
		const index = likeUsers.value.indexOf(userSeq.value);
		if (index !== -1) {
			likeUsers.value.splice(index, 1);
		}
		likes.value--;
	} else {
		likeUsers.value.push(userSeq.value);
		likes.value++;
	}
};

const bookmarkApi = async () => {
	const token = localStorage.getItem('accessToken');
	if (!token) {
		router.push('/sign-in');
		return;
	}
	changeBookmark();
	try {
		await sendRequest('post', `/bookmarks/posts/${props.post.seq}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
			},
		});
	} catch (error) {
		console.log(error);
	}
};

const changeBookmark = () => {
	if (isBookmarked.value) {
		const index = bookmarkUsers.value.indexOf(userSeq.value);
		if (index !== -1) {
			bookmarkUsers.value.splice(index, 1);
		}
	} else {
		bookmarkUsers.value.push(userSeq.value);
	}
};

const highlightKeyword = (text, keyword) => {
	if (!keyword) return text;
	const regex = new RegExp(`(${keyword})`, 'gi');
	return text.replace(regex, '<strong class="highlight"><span>$1</span></strong>');
};
</script>
