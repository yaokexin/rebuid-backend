<template>
  <div class="login-content">
    <scroll class="scroll">
      <img class="login-bg" src="./images/login-bg.png" alt="">
      <!-- 手机登录 -->
      <div class="login-container">
          <div class="input-item">
              <div class="input">
                  <label>手机号</label>
                  <input name="mobile" v-model="phoneNumber">
              </div>
              <button class="btn" @click="sendSms">{{smsBtnTxt}}</button>
          </div>
           <div class="input-item">
              <div class="input">
                  <label>验证码</label>
                  <input name="smsCode" v-model="validationCode">
              </div>
          </div>
      </div>
      <!-- 领劵按钮 -->
      <button class="confirm-btn" @click="login"></button>
      <div class="see">
          <p>看看朋友们领取情况</p>
      </div>
      <!-- 领劵用户情况 -->
      <div class="show-box">
          <ul :class="{anim:animate}">
              <li v-for="(item,index) in users" :k="index">{{item.who}}</li>       
          </ul>
      </div>   
    </scroll>
  </div>
</template>
<style lang="scss" scoped rel="stylesheet/scss">
@import "login.scss";
</style>
<script lang="ts">
  /* global MtaH5 */
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import {isPhoneNumber, isWeixin, formatDate} from '../../public/utils/common';
  // import {autoParticipate} from '../backend/promotion';
  import {showNotice, showError} from '../../public/components/toast/toast';
  import Storage from '../../public/utils/storage';
  import {getSysCode} from '../../backend/user';
  import {getCoupon, getUserDetail} from '../backend/shuangdan';
  import Scroll from '../../public/components/scroll/Scroll.vue';
  @Component({
    components: {
      scroll: Scroll,
    },
    data() {
      return {
        phoneNumber: '',
        validationCode: '',
        isSendingSms: false,
        smsBtnTxt: '获取验证码',
        animate: false,
        users: [
            {who: '用户 158****7255 已领 30元洗衣劵'},
            {who: '用户 176****7317 已领 30元洗衣劵'},
            {who: '用户 138****4293 已领 30元洗衣劵'},
            {who: '用户 182****6055 已领 30元洗衣劵'},
            {who: '用户 185****1493 已领 30元洗衣劵'},
            {who: '用户 189****9816 已领 30元洗衣劵'},
            {who: '用户 135****8569 已领 30元洗衣劵'},
        ],
      };
    },
  })
  export default class sdLogin extends Vue {
    promoCode: string // promoCode
    // resultImgUrl: string
    animate: boolean = false // 是否加过渡类
    users:any
    phoneNumber: string // 手机号
    validationCode: string // 验证码
    isSendingSms: boolean = false // 是否正在发送验证码
    timer: any = null // 定时器
    smsBtnTxt: string // 按钮显示
    totalSeconds: number = 60  // 总秒数
    smsCodeReg: RegExp = /^\d{6}$/ // 验证码 正则表达式
    channel: string // 短链标识

    sendSms() {
      if (!this.isSendingSms) {
        const isMobile: boolean = isPhoneNumber(this.phoneNumber);
        if (isMobile) {
          const param = {
            mobile: this.phoneNumber,
          };
          getSysCode(param).then((res) => {
            if (res && res.responseCode === 0) {
              this.isSendingSms = true;
              // 开始计时
              this.timer = setInterval(() => {
                if (this.totalSeconds > 0 && this.isSendingSms) {
                  this.totalSeconds -= 1;
                  this.smsBtnTxt = `${this.totalSeconds}s`;
                } else {
                  this.smsBtnTxt = '发送验证码';
                  this.totalSeconds = 60;
                  this.isSendingSms = false;
                  clearInterval(this.timer);
                  this.timer = null;
                }
              }, 1000);
            } else if (res && res.responseMsg) {
              showError(res.responseMsg);
            } else {
              showError('发送验证码失败，请稍后再试');
            }
          }, () => {
            showError('发送验证码失败，请稍后再试');
          });
        } else {
          showNotice('请输入正确的手机号');
        }
      }
    }
    login() {
      if (!this.phoneNumber) {
        showNotice('请输入手机号');
      } else if (!isPhoneNumber(this.phoneNumber)) {
        showNotice('手机号输入错误');
      } else if (!this.validationCode) {
        showNotice('请输入验证码');
      } else if (!this.smsCodeReg.test(this.validationCode)) {
        showNotice('验证码输入错误');
      } else {
        const param = {
          mobile: this.phoneNumber,
          checkCode: this.validationCode,
          // promoCode: this.promoCode,
          promoterCode: null,
          deviceToken: null,
          shortChainName: this.channel,
          jsonForm: true,
        };
        getCoupon(param).then((res: any) => {
           // 统计用户信息
          const userDetail = {
            mobile: this.phoneNumber,
            shortChainName: 'sd-loginClick',
            clickDate: res.now,
            wxPic: res.data.headImgUrl,
            jsonForm: true,
          };
          getUserDetail(userDetail).then(() => {
          });
          if (res && res.responseCode === 0) {
            // 登录成功
            const loginUser = {
              headImgUrl: res.data.headImgUrl,
              token: res.data.token,
              wxNickName: res.data.wxNickName,
              phoneNumber: this.phoneNumber,
            };
            Storage.set('LoginUser', loginUser);
            this.goSuccess(0);
          } else {
            const data = res.data;
            const loginUser = {
              headImgUrl: data.headImgUrl,
              token: data.token,
              wxNickName: data.wxNickName,
              phoneNumber: this.phoneNumber,
            };
            if (data && data.token) {
              Storage.set('LoginUser', loginUser);
            }
            if (data && data.resultCode === 'CATCHED') {   // 参加过此次活动
              Storage.set('LoginUser', loginUser);
              this.goSuccess(1);
            } else {
              showError(res.responseMsg || '验证失败,请稍后再试');
            }
          }
        }, () => {
          showError('验证失败,请稍后再试');
        });
      }
    }

    goSuccess(already:number) {
      const wx = '/sd/wxsuccess/';
      const other = '/sd/appsuccess/';
      const phone = this.phoneNumber;
      if (isWeixin()) {
        this.$router.push(`${wx}${phone}/${already}`);
      } else {
        this.$router.push(`${other}${phone}/${already}`);
      }
    }
    // 已登录用户自动领取
    // autoLogon() {
    //   const param = {
    //     promoCode: this.promoCode,
    //     jsonForm: true,
    //   };
    //   autoParticipate(param).then((res) => {
    //     if (res && res.responseCode === 0) {
    //       this.showSuccess();
    //     } else if (res && res.responseMsg.indexOf('您已经参加过此活动') !== -1) {
    //       showSuccess(res.responseMsg, () => {
    //         this.goSuccess(1);
    //       });
    //     }
    //   });
    // }
    // 通告滚动逻辑
    autoScroll() {
      this.animate = true;
      setTimeout(() => {
        this.users.push(this.users[0]);
        this.users.shift();
        this.animate = false;
      }, 500);
    }
    created() {
      // 登录落地页埋点
      const time = new Date();
      const now = formatDate(time, 'yyyy-MM-dd hh:mm:ss');
      const enterInfo = {
        clickDate: now,
        shortChainName: 'sd-loginEnter',
        jsonForm: true,
      };
      getUserDetail(enterInfo).then();
      setInterval(this.autoScroll, 1000); // 数据加载后触发
      // this.shortChainName = this.$route.params.shortChainName;
      // this.promoCode = this.$route.params.promoCode;
      // const args = getArgs();
      // if (args.openid) {
      //   this.openid = args.openid;
      // }
      if (Storage.get('LoginUser')) {
        const LoginUser = Storage.get('LoginUser');
        this.phoneNumber = LoginUser.phoneNumber;
        const param = {
          mobile: LoginUser.phoneNumber,
          // checkCode: this.validationCode,
          // promoCode: this.promoCode,
          promoterCode: null,
          deviceToken: null,
          // shortChainName: this.shortChainName,
          jsonForm: true,
        };
        getCoupon(param).then((res: any) => {
          if (res.data && res.data.resultCode === 'CATCHED') {
            // 领取过
            this.goSuccess(1);
          }
        }, () => {
          showError('登录失败,请稍后再试');
        });
      }
      this.channel = this.$route.params.channel;
      MtaH5.clickStat('sdlogin', {channel: this.channel});
    }
  }
</script>
