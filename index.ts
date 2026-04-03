import { db, PERM, Handler, Context, Types, param, ValidationError, query } from 'hydrooj';

const coll = db.collection('swiper');

async function getSwiper(domainId: string) {
    const data = await coll.findOne({ domainId });
    if (!data) return [null, null];
    const sdocs = data['config'];
    const ssdict = {
        loop: data['loop'],
        autoplay: data['autoplay'],
        interval: data['interval'],
    };
    return [sdocs, ssdict];
}

async function setSwiper(domainId: string, sdocs: any[], ssdict: { loop: boolean; autoplay: boolean; interval: number }) {
    await coll.updateOne({ domainId }, {
        $set: { loop: ssdict.loop, autoplay: ssdict.autoplay, interval: ssdict.interval,config: sdocs },
    }, { upsert: true });
}

class DomainSwiperHandler extends Handler {
    async get(domainId: string) {
        const [sdocs, ssdict] = await getSwiper( domainId );
        if (!sdocs) {
            this.response.body = {
                initialize: true,
                domainId,
                ssdict: { loop: true, autoplay: true, interval: 5000 },
                value: ''
            };
        }
        else {
            const value=JSON.stringify(sdocs, null, 2);
            this.response.body = { domainId, ssdict, value};
        }
        this.response.template = 'domain_swiper.html';
    }
    
    @param('loop', Types.Boolean)
    @param('autoplay', Types.Boolean)
    @param('interval', Types.Int)
    @param('value', Types.Content)
    async post(domainId: string, loop: boolean, autoplay: boolean, interval: number, value: string) {
        let sdocs: any[] = [];
        try{
            sdocs=JSON.parse(value);
        }catch(e){
            throw new ValidationError('config', null, e.message);
        }
        await setSwiper(domainId, sdocs, { loop, autoplay, interval });
        this.response.redirect = this.url('domain_swiper');
    }
}

export async function apply(ctx: Context) {
    ctx.withHandlerClass('HomeHandler', (HomeHandler) => {
        HomeHandler.prototype.getSwiper = getSwiper;
    });

    ctx.Route('domain_swiper','/domain/swiper', DomainSwiperHandler,PERM.PERM_EDIT_DOMAIN);
    ctx.injectUI('DomainManage', 'domain_swiper',{family: 'Properties', icon: 'info' });
    ctx.i18n.load('zh', {
        domain_swiper: '轮播图配置',
    });

}
