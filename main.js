import { using } from "./Utils/ModClasses.js";

const BuffStates = new Map();
using("Terraria");
using("Terraria.GameContent");
using("Microsoft.Xna.Framework");
using("Microsoft.Xna.Framework.Graphics");

class RectHelper {
    static New = (x, y, width, height) => {
        const r = Rectangle.new();
        r.X = x | 0;
        r.Y = y | 0;
        r.Width = width | 0;
        r.Height = height | 0;
        return r;
    };
}

class Vec2Helper {
    static New = Vector2.new()["void .ctor(float x, float y)"];
    static Subtract =
        Vector2["Vector2 op_Subtraction(Vector2 value1, Vector2 value2)"];
}

class DebuffDrawer {
    constructor() {
        this.buffWidth = 32;
        this.buffHeight = 32;
        this.buffSpacing = 36;
        this.buffStates = BuffStates;
    }

    static instance = new DebuffDrawer();

    getPlayerBuffState(playerID) {
        if (!this.buffStates.has(playerID)) this.buffStates.set(playerID, []);
        return this.buffStates.get(playerID);
    }
    drawBuffs() {
        const player = Main.player[0];
        const screenOffset = Vec2Helper.Subtract(
            player.Center,
            Main.screenPosition
        );
        const playerBuffs = this.getPlayerBuffState(player.whoAmI);

        const activeBuffs = [];
        for (let i = 0; i < player.buffType.length; i++) {
            const buffType = player.buffType[i] | 0;
            const buffTime = player.buffTime[i] | 0;
            if (buffType > 0 && buffTime > 0)
                activeBuffs.push({ i, type: buffType, time: buffTime });
        }
        if (activeBuffs.length === 0) return;

        const totalWidth = (activeBuffs.length - 1) * this.buffSpacing;

        const startX = screenOffset.X - totalWidth / 2;

        for (let idx = 0; idx < activeBuffs.length; idx++) {
            const { i, type: buffType, time: buffTime } = activeBuffs[idx];

            if (!playerBuffs[i] || playerBuffs[i].type !== buffType) {
                playerBuffs[i] = { type: buffType, maxTime: buffTime };
            } else if (buffTime > playerBuffs[i].maxTime) {
                playerBuffs[i].maxTime = buffTime;
            }
            const buffState = playerBuffs[i];

            const progress = MathHelper.Clamp(
                buffTime / buffState.maxTime,
                0,
                1
            );
            const activeHeight = Math.floor(this.buffHeight * progress);
            const inactiveHeight = this.buffHeight - activeHeight;

            const drawX = Math.floor(startX + idx * this.buffSpacing);
            const drawY = Math.floor(screenOffset.Y - 40);
            const texture = TextureAssets.Buff[buffType].Value;

            Main[
                "void EntitySpriteDraw(Texture2D texture, Vector2 position, Rectangle sourceRectangle, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effects, float worthless)"
            ](
                texture,
                Vec2Helper.New(drawX, drawY),
                RectHelper.New(0, 0, this.buffWidth, this.buffHeight),
                Color.Lerp(Color.White, Color.Transparent, 0.6),
                0,
                Vec2Helper.New(this.buffWidth / 2, this.buffHeight / 2),
                1,
                SpriteEffects.None,
                0
            );

            if (activeHeight > 0) {
                const srcRect = RectHelper.New(
                    0,
                    inactiveHeight,
                    this.buffWidth,
                    activeHeight
                );
                const origin = Vec2Helper.New(
                    this.buffWidth / 2,
                    activeHeight / 2
                );
                const dst = Vec2Helper.New(drawX, drawY + inactiveHeight / 2);

                Main[
                    "void EntitySpriteDraw(Texture2D texture, Vector2 position, Rectangle sourceRectangle, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effects, float worthless)"
                ](
                    texture,
                    dst,
                    srcRect,
                    Color.White,
                    0,
                    origin,
                    1,
                    SpriteEffects.None,
                    0
                );
            }
        }
    }
}

Main.DrawRain.hook((orig, self) => {
    orig(self);
    DebuffDrawer.instance.drawBuffs();
});
