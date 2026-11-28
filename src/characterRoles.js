export const characterRoles={
 hero:{label:'Nhân vật chính'},
 minion:{label:'Quái con',type:'enemy',stats:{hp:2,dmg:1,spd:1.7,chase:6,ai:'wander'}},
 elite:{label:'Quái tinh anh',type:'enemy',stats:{hp:8,dmg:2,spd:2,chase:8,ai:'chase'}},
 boss:{label:'Boss',type:'enemy',stats:{hp:24,dmg:4,spd:1.5,chase:10,ai:'chase'}},
 guard:{label:'Quái canh gác',type:'enemy',stats:{hp:5,dmg:1,spd:1.6,chase:5,ai:'still'}},
 villager:{label:'Dân làng',type:'npc',text:'Chào bạn!'},
 merchant:{label:'Thương nhân',type:'npc',text:'Chào mừng bạn ghé cửa hàng.'},
 quest:{label:'NPC giao nhiệm vụ',type:'npc',text:'Tôi có chuyện muốn nhờ bạn.'},
 ally:{label:'Đồng minh',type:'npc',text:'Tôi đứng về phía bạn.'},
 companion:{label:'Thú cưng',type:'npc',text:''},
 scenery:{label:'Nhân vật trang trí',type:'npc',text:''}
};
