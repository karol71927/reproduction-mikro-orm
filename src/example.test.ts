import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity()
class Recipe {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @OneToMany(() => Ingredient, ingredient => ingredient.recipe)
  ingredients = new Collection<Ingredient>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Ingredient {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  quantity: number;

  @Property({
    onCreate: () => new Date(),
  })
  createdAt!: Date;

  @ManyToOne(() => Recipe)
  recipe!: Recipe;

  constructor(name: string, quantity: number) {
    this.name = name;
    this.quantity = quantity;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Recipe],
    dbName: '5577',
    port: 3308,
    timezone: '+02:00',
    debug: true,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('5577', async () => {
  const r = new Recipe('My first recipe');
  r.ingredients.add(new Ingredient('Flour', 500));
  r.ingredients.add(new Ingredient('Sugar', 200));
  r.ingredients.add(new Ingredient('Milk', 200));
  orm.em.persist(r);
  await orm.em.flush();
  orm.em.clear();

  const recipe = await orm.em.findOneOrFail(
    Recipe,
    { title: 'My first recipe' },
    { populate: ['ingredients'] },
  );

  const withPopulate = recipe.ingredients
    .getItems()
    .find(x => x.name === 'Flour');

  console.log(withPopulate);

  const ingredients = await orm.em.find(Ingredient, {
    recipe: { id: recipe.id },
  });

  const withoutPopulate = ingredients.find(x => x.name === 'Flour');
  console.log(withoutPopulate);
});